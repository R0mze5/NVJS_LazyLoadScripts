'use strict';

// Массив разрешений для отслеживания прохождения разрешений (накапливается из вызовов функций)
let resizeResolutions = [920]; // ! сделать, чтобы resizeHandler() подхватывала дополненные разрешени

// собираем все ссылки на уже подключенные скрипты
let refArray = Array.from(document.querySelectorAll('script')).map(script => script.src).filter(src => src.length > 0);

// сюда складываются все результаты вызовов функций
let funcObj = {};

let defferedCall = {}; // накопление функций с отложенным вызовом

// здесь задаются все условия и порядок вызова функций
let callStack = {
  // menu: {
  //   expression: document.querySelector('.header'),
  //   ref: '/local/templates/website/js/NVJS_Menu.js',
  //   callFunc: () => { 
  //     new NVJSMenu({}); 
  //   },
  // },
  // swiper: {
  //   expression: document.querySelector('.swiper-container'),
  //   ref: '/local/templates/website/js/vendors/swiper.js',
  //   callFunc: addSwiper,
  //   async: 'false',
  //   callback: 'menu',
  // },
};

function externalCall(externalFunc) {
  if (window[externalFunc]) {
    window[externalFunc]();
  }
    
}

function callFunction(key) {
  if (this.callFunc) {
    let initResult = this.callFunc(this.callback);

    funcObj[key] = initResult;

    return initResult;
  }
}

// прогоняем все значения callstack и вызываем наобходимые функции в необходимом порядке
Promise.all(Object.keys(callStack).map(callStackInitialize))
  .then(() => {
    return Promise.all(Object.keys(defferedCall).map(callStackUnassociated));
  })
  .then(() => {
    callStackDeffered();
  })
  .catch((e) => {
    console.log(e);
  });
    
function callStackInitialize(key) {

  if (callStack[key] && (callStack[key].expression || typeof callStack[key].expression === 'undefined')) {
    let data = callStack[key];

    // переписать на проверку уже в вызванных функциях
    if (data.async) {
      if (!data.ref) {
        defferedCall[key] = new Promise((resolve) => {
          resolve();
        });
      } else if (!refArray.includes(callStack[data.async].ref)) {
        defferedCall[key] = createPromise(data.ref);
        refArray.push(data.ref);
      }
    } else if (data.ref && !refArray.includes(data.ref)) { 

      return createPromise(data.ref)
        .then(() => {
          refArray.push(data.ref);
          callFunction.call(data, key);
        })
        .catch((e) => {
          console.error(e);
          console.warn(`script ${key} on ${data.ref} was rejected, some functions may work wrong`);
        });
                
    } else {
      return new Promise((resolve) => {
        callFunction.call(data, key);
        resolve();
      });
    }

  }

}

function callStackUnassociated(key) {
  let data = callStack[key];
  let blocked = data.async;

  // проверяем скрипты, у которых родители не могут быть вызваны для данной страницы и вызываем их и заодно начинаем вызов отложенных функций
  if ((!(blocked in funcObj) && !(blocked in defferedCall)) || (blocked in funcObj)) {

    return defferedCall[key]
      .then(() => {
        callFunction.call(data, key);
        delete defferedCall[key];
      });
  }
}

function callStackDeffered() {
  Promise.all(Object.keys(defferedCall).map(key => {
    let data = callStack[key];
    let blocked = data.async;    
        
    if (blocked in funcObj) {

      return defferedCall[key]
        .then(() => {
          callFunction.call(data, key);
          delete defferedCall[key];
        });
    }
  })).then(() => {
    // console.log(Object.keys(defferedCall))
    if (Object.keys(defferedCall).length > 0) {
      callStackDeffered();
    }
  })
    .catch(e => {
        
    });

}

/* ************************ common functions ************************ */


/* ************************ ./common functions ************************ */
/* ************************ services functions ************************ */

function createPromise(ref) {
  return new Promise((resolve, reject) => {
    let addedScript = document.createElement('script');

    addedScript.src = ref;
    addedScript.async = true;
    document.body.append(addedScript);
    addedScript.onload = function() {
      resolve();
    };
    addedScript.onerror = function() {
      reject(ref);
    };
  })
    .catch((ref) => {
      console.warn(`script link ${ref} was not add, because link adress doesn't exist`);
    });
}

function resizeHandler(resolutions, restart) {
  // ! продумать, как можно убрать несколько вызовов функции resizeSolution при прохождении через контрольную точку, не заблокировав вызов других точек
  // ! доработать перезагрузку страницы при необходимости
  let xpos = 0;
  let lastxPos;
  let widening; // show forward of resize

  let prevFlag; 
  let nextFlag;

  getFlags();
        
  window.addEventListener('resize', () => {
    lastxPos = xpos;
    xpos = window.innerWidth;

    if ((xpos > lastxPos) && (nextFlag > lastxPos)) {
      widening = true;
      resizeSolution();
    } else if ((xpos < lastxPos) && (lastxPos < prevFlag )) {
      resizeSolution();
      widening = false;
    }
  });

  function resizeSolution() {
    getFlags();
    window.dispatchEvent(new Event('restartOnResize'));
  }

  function getFlags() {
    if (widening === true) {
      prevFlag = nextFlag;
      nextFlag = getFlag('next');
    } else if (widening === false) {
      nextFlag = prevFlag;
      prevFlag = getFlag('prev');
    } else {
      prevFlag = getFlag('prev'); 
      nextFlag = getFlag('next');
    }
  }

  function getFlag(forward) {
    let k = forward == 'prev' ? -1 : 1;
    let foundElement;

    resizeResolutions.forEach(elem => {
      if ((window.innerWidth * k) < (elem * k)) {
        foundElement = elem;
      }
    });
        
    return foundElement;
  }
}
// ! Доработка плавного скроллинга при клике на якорь
// ! Доработка lazy load изображений

/* ************************ ./services functions ************************ */

