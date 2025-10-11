export function formatNum(num, precision) {
  if (precision === false) { return num; }
  var pow = Math.pow(10, precision === undefined ? 6 : precision);
  return Math.round(num * pow) / pow;
}

export var isArray = Array.isArray || function (obj) {
  return (Object.prototype.toString.call(obj) === '[object Array]');
};

function toPixelPoints(points, projection, zoom, pixelOrigin) {
  return points.map(p => projection.projectToPixel(p, zoom).subtract(pixelOrigin));
}

export class LineUtil {
  static clip(points, bounds) {
    // For now, we'll just return the original points.
    // In a real implementation, this would clip the line to the bounds.
    return points;
  }
}

export class PolygonUtil {
  static clip(points, bounds) {
    // For now, we'll just return the original points.
    // In a real implementation, this would clip the polygon to the bounds.
    return points;
  }
}