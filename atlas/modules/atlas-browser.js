import { falseFn } from './atlas-utils.js';

function userAgentContains(str) {
  return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
}

var style = document.documentElement.style;
var ie = 'ActiveXObject' in window;
var ielt9 = ie && !document.addEventListener;
var edge = 'msLaunchUri' in navigator && !('documentMode' in document);
var webkit = userAgentContains('webkit');
var android = userAgentContains('android');
var android23 = userAgentContains('android 2') || userAgentContains('android 3');
var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10);
var androidStock = android && userAgentContains('Google') && webkitVer < 537 && !('AudioNode' in window);
var opera = !!window.opera;
var chrome = !edge && userAgentContains('chrome');
var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;
var safari = !chrome && userAgentContains('safari');
var phantom = userAgentContains('phantom');
var opera12 = 'OTransition' in style;
var win = navigator.platform.indexOf('Win') === 0;
var ie3d = ie && ('transition' in style);
var webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;
var gecko3d = 'MozPerspective' in style;
var any3d = !window.ATLAS_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;
var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');
var mobileWebkit = mobile && webkit;
var mobileWebkit3d = mobile && webkit3d;
var msPointer = !window.PointerEvent && window.MSPointerEvent;
var pointer = !!(window.PointerEvent || msPointer);
var touchNative = 'ontouchstart' in window || !!window.TouchEvent;
var touch = !window.ATLAS_NO_TOUCH && (touchNative || pointer);
var mobileOpera = mobile && opera;
var mobileGecko = mobile && gecko;
var retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

var passiveEvents = (function () {
  var supportsPassiveOption = false;
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassiveOption = true;
      }
    });
    window.addEventListener('testPassiveEventSupport', falseFn, opts);
    window.removeEventListener('testPassiveEventSupport', falseFn, opts);
  } catch (e) {
  }
  return supportsPassiveOption;
}());

function svgCreate(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}

var canvas$1 = (function () {
  return !!document.createElement('canvas').getContext;
}());
var svg$1 = !!(document.createElementNS && svgCreate('svg').createSVGRect);
var inlineSvg = !!svg$1 && (function () {
  var div = document.createElement('div');
  div.innerHTML = '<svg/>';
  return (div.firstChild && div.firstChild.namespaceURI) === 'http://www.w3.org/2000/svg';
})();
var vml = !svg$1 && (function () {
  try {
    var div = document.createElement('div');
    div.innerHTML = '<v:shape adj="1"/>';
    var shape = div.firstChild;
    shape.style.behavior = 'url(#default#VML)';
    return shape && (typeof shape.adj === 'object');
  } catch (e) {
    return false;
  }
}());

var mac = navigator.platform.indexOf('Mac') === 0;
var linux = navigator.platform.indexOf('Linux') === 0;

export var Browser = {
  ie: ie,
  ielt9: ielt9,
  edge: edge,
  webkit: webkit,
  android: android,
  android23: android23,
  androidStock: androidStock,
  opera: opera,
  chrome: chrome,
  gecko: gecko,
  safari: safari,
  phantom: phantom,
  opera12: opera12,
  win: win,
  ie3d: ie3d,
  webkit3d: webkit3d,
  gecko3d: gecko3d,
  any3d: any3d,
  mobile: mobile,
  mobileWebkit: mobileWebkit,
  mobileWebkit3d: mobileWebkit3d,
  msPointer: msPointer,
  pointer: pointer,
  touch: touch,
  touchNative: touchNative,
  mobileOpera: mobileOpera,
  mobileGecko: mobileGecko,
  retina: retina,
  passiveEvents: passiveEvents,
  canvas: canvas$1,
  svg: svg$1,
  vml: vml,
  inlineSvg: inlineSvg,
  mac: mac,
  linux: linux
};