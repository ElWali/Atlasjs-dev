import { formatNum, isArray } from '../utils.js';

const trunc = Math.trunc || function (v) {
  return v > 0 ? Math.floor(v) : Math.ceil(v);
};

class PixelPoint {
  constructor(x, y, round) {
    this.x = (round ? Math.round(x) : x);
    this.y = (round ? Math.round(y) : y);
  }

  clone() {
    return new PixelPoint(this.x, this.y);
  }

  add(point) {
    const newPoint = this.clone();
    newPoint.x += point.x;
    newPoint.y += point.y;
    return newPoint;
  }

  subtract(point) {
    const newPoint = this.clone();
    newPoint.x -= point.x;
    newPoint.y -= point.y;
    return newPoint;
  }

  divideBy(num) {
    const newPoint = this.clone();
    newPoint.x /= num;
    newPoint.y /= num;
    return newPoint;
  }

  multiplyBy(num) {
    const newPoint = this.clone();
    newPoint.x *= num;
    newPoint.y *= num;
    return newPoint;
  }

  scaleBy(point) {
    return new PixelPoint(this.x * point.x, this.y * point.y);
  }

  unscaleBy(point) {
    return new PixelPoint(this.x / point.x, this.y / point.y);
  }

  round() {
    const newPoint = this.clone();
    newPoint.x = Math.round(newPoint.x);
    newPoint.y = Math.round(newPoint.y);
    return newPoint;
  }

  floor() {
    const newPoint = this.clone();
    newPoint.x = Math.floor(newPoint.x);
    newPoint.y = Math.floor(newPoint.y);
    return newPoint;
  }

  ceil() {
    const newPoint = this.clone();
    newPoint.x = Math.ceil(newPoint.x);
    newPoint.y = Math.ceil(newPoint.y);
    return newPoint;
  }

  trunc() {
    const newPoint = this.clone();
    newPoint.x = trunc(newPoint.x);
    newPoint.y = trunc(newPoint.y);
    return newPoint;
  }

  distanceTo(point) {
    const x = point.x - this.x;
    const y = point.y - this.y;
    return Math.sqrt(x * x + y * y);
  }

  equals(point) {
    return point.x === this.x && point.y === this.y;
  }

  contains(point) {
    return Math.abs(point.x) <= Math.abs(this.x) &&
           Math.abs(point.y) <= Math.abs(this.y);
  }

  toString() {
    return `PixelPoint(${formatNum(this.x)}, ${formatNum(this.y)})`;
  }
}

export function toPixelPoint(x, y, round) {
  if (x instanceof PixelPoint) {
    return x;
  }
  if (isArray(x)) {
    return new PixelPoint(x[0], x[1]);
  }
  if (x === undefined || x === null) {
    return x;
  }
  if (typeof x === 'object' && 'x' in x && 'y' in x) {
    return new PixelPoint(x.x, x.y);
  }
  return new PixelPoint(x, y, round);
}

export default PixelPoint;