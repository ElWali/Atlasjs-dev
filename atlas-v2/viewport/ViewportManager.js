import { toGeoPoint } from '../geometry/GeoPoint.js';
import PixelPoint from '../geometry/PixelPoint.js';
import Area from '../geometry/Area.js';

class ViewportManager {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.stateManager = engine.stateManager;

    // Initialize viewport state
    this.stateManager.set('viewport.center', options.center || [0, 0]);
    this.stateManager.set('viewport.zoom', options.zoom || 1);
  }

  navigateTo({ center, zoom }) {
    // This will eventually contain the logic to smoothly pan and zoom the map.
    // For now, it just updates the state.
    if (center) {
      this.stateManager.set('viewport.center', center);
    }
    if (zoom) {
      this.stateManager.set('viewport.zoom', zoom);
    }
  }

  zoomIn(delta = 1) {
    const currentZoom = this.stateManager.get('viewport.zoom');
    this.navigateTo({ zoom: currentZoom + delta });
  }

  zoomOut(delta = 1) {
    const currentZoom = this.stateManager.get('viewport.zoom');
    this.navigateTo({ zoom: currentZoom - delta });
  }

  panBy(offset) {
    const center = this.stateManager.get('viewport.center');
    const zoom = this.stateManager.get('viewport.zoom');
    const projection = this.engine.projection;

    const currentPixel = projection.projectToPixel(toGeoPoint(center), zoom);
    const newPixel = currentPixel.add(new PixelPoint(offset.x, offset.y));
    const newCenter = projection.unprojectFromPixel(newPixel, zoom);

    this.navigateTo({ center: [newCenter.lat, newCenter.lng] });
  }

  getPixelOrigin() {
    const center = this.stateManager.get('viewport.center');
    const zoom = this.stateManager.get('viewport.zoom');
    const projection = this.engine.projection;
    const pixelPoint = projection.projectToPixel(toGeoPoint(center), zoom);
    const viewHalf = this.getSize().divideBy(2);
    return pixelPoint.subtract(viewHalf).round();
  }

  getSize() {
    const container = this.engine.container;
    return new PixelPoint(container.clientWidth, container.clientHeight);
  }

  getPixelBounds() {
    const size = this.getSize();
    return new Area([0, 0], [size.x, size.y]);
  }
}

export default ViewportManager;