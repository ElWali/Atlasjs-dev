import PixelPoint from '../geometry/PixelPoint.js';
import GeoPoint from '../geometry/GeoPoint.js';
import Area from '../geometry/Area.js';

const R = 6378137;
const MAX_LATITUDE = 85.0511287798;

class Mercator {
  constructor() {
    this.R = R;
    this.MAX_LATITUDE = MAX_LATITUDE;
    const d = R * Math.PI;
    this.bounds = new Area([-d, -d], [d, d]);
  }

  project(geoPoint) {
    const d = Math.PI / 180;
    const max = this.MAX_LATITUDE;
    const lat = Math.max(Math.min(max, geoPoint.lat), -max);
    const sin = Math.sin(lat * d);

    return new PixelPoint(
      this.R * geoPoint.lng * d,
      this.R * Math.log((1 + sin) / (1 - sin)) / 2
    );
  }

  unproject(pixelPoint) {
    const d = 180 / Math.PI;
    return new GeoPoint(
      (2 * Math.atan(Math.exp(pixelPoint.y / this.R)) - (Math.PI / 2)) * d,
      pixelPoint.x * d / this.R
    );
  }
}

export default Mercator;