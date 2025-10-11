import Mercator from './Mercator.js';
import Transformation from './Transformation.js';

class EPSG3857 {
  constructor() {
    this.code = 'EPSG:3857';
    this.projection = new Mercator();

    const scale = 0.5 / (Math.PI * this.projection.R);
    this.transformation = new Transformation(scale, 0.5, -scale, 0.5);
  }

  project(geoPoint) {
    return this.projection.project(geoPoint);
  }

  unproject(pixelPoint) {
    return this.projection.unproject(pixelPoint);
  }

  projectToPixel(geoPoint, zoom) {
    const projectedPoint = this.project(geoPoint);
    const scale = this.scale(zoom);
    return this.transformation.transform(projectedPoint, scale);
  }

  unprojectFromPixel(pixelPoint, zoom) {
    const scale = this.scale(zoom);
    const untransformedPoint = this.transformation.untransform(pixelPoint, scale);
    return this.unproject(untransformedPoint);
  }

  // The following methods will be part of the ProjectionSystem
  // and will be moved there later.
  scale(zoom) {
    return 256 * Math.pow(2, zoom);
  }

  zoom(scale) {
    return Math.log(scale / 256) / Math.LN2;
  }
}

export default EPSG3857;