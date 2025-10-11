import PixelPoint from '../geometry/PixelPoint.js';

class Transformation {
  constructor(a, b, c, d) {
    if (Array.isArray(a)) {
      this._a = a[0];
      this._b = a[1];
      this._c = a[2];
      this._d = a[3];
      return;
    }
    this._a = a;
    this._b = b;
    this._c = c;
    this._d = d;
  }

  transform(point, scale = 1) {
    const newPoint = point.clone();
    newPoint.x = scale * (this._a * newPoint.x + this._b);
    newPoint.y = scale * (this._c * newPoint.y + this._d);
    return newPoint;
  }

  untransform(point, scale = 1) {
    return new PixelPoint(
      (point.x / scale - this._b) / this._a,
      (point.y / scale - this._d) / this._c
    );
  }
}

export default Transformation;