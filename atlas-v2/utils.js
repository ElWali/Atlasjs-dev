export function formatNum(num, precision) {
  if (precision === false) { return num; }
  var pow = Math.pow(10, precision === undefined ? 6 : precision);
  return Math.round(num * pow) / pow;
}

export var isArray = Array.isArray || function (obj) {
  return (Object.prototype.toString.call(obj) === '[object Array]');
};