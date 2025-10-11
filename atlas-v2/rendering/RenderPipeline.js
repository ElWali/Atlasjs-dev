import GeoPoint from '../geometry/GeoPoint.js';
import GeoLine from '../geometry/GeoLine.js';
import GeoPolygon from '../geometry/GeoPolygon.js';
import PixelPoint from '../geometry/PixelPoint.js';
import { LineUtil, PolygonUtil } from '../utils.js';

class RenderPipeline {
  constructor(engine) {
    this.engine = engine;
    this.renderer = null; // This will hold the actual rendering engine (e.g., Canvas, WebGL)
    this._initRenderer();
  }

  _initRenderer() {
    // For now, we'll use a simple canvas renderer.
    // This can be extended to support other rendering backends like WebGL.
    const canvas = document.createElement('canvas');
    this.engine.container.appendChild(canvas);
    this.renderer = canvas.getContext('2d');

    this.engine.stateManager.watch('viewport.resize', this._onResize.bind(this));
    this._onResize(); // Initial resize
  }

  _onResize() {
      const container = this.engine.container;
      this.renderer.canvas.width = container.clientWidth;
      this.renderer.canvas.height = container.clientHeight;
      this.render();
  }

  render() {
    // Clear the canvas
    this.renderer.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);

    // This is where we will loop through all the surfaces and render them.
    const surfaces = this.engine.surfaces.surfaces;
    for (const surface of surfaces) {
      if (surface.render) {
        surface.render(this.renderer);
      }
    }
  }

  draw(renderer, feature) {
    const projection = this.engine.projection;
    const zoom = this.engine.stateManager.get('viewport.zoom');
    const pixelOrigin = this.engine.viewport.getPixelOrigin();
    const bounds = this.engine.viewport.getPixelBounds();

    renderer.strokeStyle = feature.style.color;
    renderer.lineWidth = feature.style.weight;
    renderer.fillStyle = feature.style.fillColor;
    renderer.globalAlpha = feature.style.fillOpacity;

    if (feature.geometry instanceof GeoPoint) {
      this._drawPoint(renderer, feature.geometry, projection, zoom, pixelOrigin);
    } else if (feature.geometry instanceof GeoLine) {
      this._drawLine(renderer, feature.geometry, projection, zoom, pixelOrigin, bounds);
    } else if (feature.geometry instanceof GeoPolygon) {
      this._drawPolygon(renderer, feature.geometry, projection, zoom, pixelOrigin, bounds);
    }
  }

  _toPixelPoints(points, projection, zoom, pixelOrigin) {
    return points.map(p => projection.projectToPixel(p, zoom).subtract(pixelOrigin));
  }

  _drawPoint(renderer, geometry, projection, zoom, pixelOrigin) {
    const pixelPoint = projection.projectToPixel(geometry, zoom).subtract(pixelOrigin);
    renderer.beginPath();
    renderer.arc(pixelPoint.x, pixelPoint.y, 5, 0, 2 * Math.PI);
    renderer.fill();
    renderer.stroke();
  }

  _drawLine(renderer, geometry, projection, zoom, pixelOrigin, bounds) {
    const points = this._toPixelPoints(geometry.points, projection, zoom, pixelOrigin);
    const clippedPoints = LineUtil.clip(points, bounds);

    if (clippedPoints.length === 0) {
      return;
    }

    renderer.beginPath();
    for (let i = 0; i < clippedPoints.length; i++) {
      const p = clippedPoints[i];
      if (i === 0) {
        renderer.moveTo(p.x, p.y);
      } else {
        renderer.lineTo(p.x, p.y);
      }
    }
    renderer.stroke();
  }

  _drawPolygon(renderer, geometry, projection, zoom, pixelOrigin, bounds) {
    const points = this._toPixelPoints(geometry.points, projection, zoom, pixelOrigin);
    const clippedPoints = PolygonUtil.clip(points, bounds);

    if (clippedPoints.length === 0) {
      return;
    }

    renderer.beginPath();
    for (let i = 0; i < clippedPoints.length; i++) {
      const p = clippedPoints[i];
      if (i === 0) {
        renderer.moveTo(p.x, p.y);
      } else {
        renderer.lineTo(p.x, p.y);
      }
    }
    renderer.closePath();
    renderer.fill();
    renderer.stroke();
  }
}

export default RenderPipeline;