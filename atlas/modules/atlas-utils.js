export var version = "0.0.1";

export function extend(dest) {
  var i, j, len, src;
  for (j = 1, len = arguments.length; j < len; j++) {
    src = arguments[j];
    for (i in src) {
      dest[i] = src[i];
    }
  }
  return dest;
}

export var create = Object.create || (function () {
  function F() {}
  return function (proto) {
    F.prototype = proto;
    return new F();
  };
})();

export function bind(fn, obj) {
  var slice = Array.prototype.slice;
  if (fn.bind) {
    return fn.bind.apply(fn, slice.call(arguments, 1));
  }
  var args = slice.call(arguments, 2);
  return function () {
    return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
  };
}

var lastId = 0;
export function stamp(obj) {
  if (!('_atlas_id' in obj)) {
    obj['_atlas_id'] = ++lastId;
  }
  return obj._atlas_id;
}

export function throttle(fn, time, context) {
  var lock, args, wrapperFn, later;
  later = function () {
    lock = false;
    if (args) {
      wrapperFn.apply(context, args);
      args = false;
    }
  };
  wrapperFn = function () {
    if (lock) {
      args = arguments;
    } else {
      fn.apply(context, arguments);
      setTimeout(later, time);
      lock = true;
    }
  };
  return wrapperFn;
}

export function wrapNum(x, range, includeMax) {
  var max = range[1],
      min = range[0],
      d = max - min;
  return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
}

export function falseFn() { return false; }

export function formatNum(num, precision) {
  if (precision === false) { return num; }
  var pow = Math.pow(10, precision === undefined ? 6 : precision);
  return Math.round(num * pow) / pow;
}

export function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

export function splitWords(str) {
  return trim(str).split(/\s+/);
}

export function setOptions(obj, options) {
  if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
    obj.options = obj.options ? create(obj.options) : {};
  }
  for (var i in options) {
    obj.options[i] = options[i];
  }
  return obj.options;
}

export function getParamString(obj, existingUrl, uppercase) {
  var params = [];
  for (var i in obj) {
    params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
  }
  return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
}

var templateRe = /\{ *([\w_ -]+) *\}/g;
export function template(str, data) {
  return str.replace(templateRe, function (str, key) {
    var value = data[key];
    if (value === undefined) {
      throw new Error('No value provided for variable ' + str);
    } else if (typeof value === 'function') {
      value = value(data);
    }
    return value;
  });
}

export var isArray = Array.isArray || function (obj) {
  return (Object.prototype.toString.call(obj) === '[object Array]');
};

export function indexOf(array, el) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === el) { return i; }
  }
  return -1;
}

export var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

function getPrefixed(name) {
  return window['webkit' + name] || window['moz' + name] || window['ms' + name];
}

var lastTime = 0;
function timeoutDefer(fn) {
  var time = +new Date(),
      timeToCall = Math.max(0, 16 - (time - lastTime));
  lastTime = time + timeToCall;
  return window.setTimeout(fn, timeToCall);
}

export var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
export var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
    getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };

export function requestAnimFrame(fn, context, immediate) {
  if (immediate && requestFn === timeoutDefer) {
    fn.call(context);
  } else {
    return requestFn.call(window, bind(fn, context));
  }
}

export function cancelAnimFrame(id) {
  if (id) {
    cancelFn.call(window, id);
  }
}