(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.atlas = {}));
})(this, (function (exports) { 'use strict';

  class StateManager {
    constructor() {
      this.state = {};
      this.listeners = {};
    }

    set(key, value) {
      this.state[key] = value;
      if (this.listeners[key]) {
        this.listeners[key].forEach(listener => listener(value));
      }
    }

    get(key) {
      return this.state[key];
    }

    watch(key, listener) {
      if (!this.listeners[key]) {
        this.listeners[key] = [];
      }
      this.listeners[key].push(listener);
    }

    unwatch(key, listener) {
      if (this.listeners[key]) {
        this.listeners[key] = this.listeners[key].filter(l => l !== listener);
      }
    }
  }

  class CommandBus {
    constructor() {
      this.handlers = {};
    }

    register(commandName, handler) {
      this.handlers[commandName] = handler;
    }

    execute(commandName, payload) {
      const handler = this.handlers[commandName];
      if (handler) {
        return handler(payload);
      }
      throw new Error(`No handler registered for command: ${commandName}`);
    }
  }

  function formatNum(num, precision) {
    if (precision === false) { return num; }
    var pow = Math.pow(10, precision === undefined ? 6 : precision);
    return Math.round(num * pow) / pow;
  }

  var isArray = Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
  };

  class LineUtil {
    static clip(points, bounds) {
      // For now, we'll just return the original points.
      // In a real implementation, this would clip the line to the bounds.
      return points;
    }
  }

  class PolygonUtil {
    static clip(points, bounds) {
      // For now, we'll just return the original points.
      // In a real implementation, this would clip the polygon to the bounds.
      return points;
    }
  }

  class Area {
    constructor(corner1, corner2) {
      if (corner1) {
        const points = corner2 ? [corner1, corner2] : corner1;
        for (const point of points) {
          this.extend(point);
        }
      }
    }

    extend(obj) {
      let sw2, ne2;

      if (obj instanceof GeoPoint) {
        sw2 = obj;
        ne2 = obj;
      } else if (obj instanceof Area) {
        sw2 = obj._southWest;
        ne2 = obj._northEast;
        if (!sw2 || !ne2) { return this; }
      } else {
        obj = toGeoPoint(obj) || toArea(obj);
        return this.extend(obj);
      }

      if (!this._southWest && !this._northEast) {
        this._southWest = new GeoPoint(sw2.lat, sw2.lng);
        this._northEast = new GeoPoint(ne2.lat, ne2.lng);
      } else {
        this._southWest.lat = Math.min(sw2.lat, this._southWest.lat);
        this._southWest.lng = Math.min(sw2.lng, this._southWest.lng);
        this._northEast.lat = Math.max(ne2.lat, this._northEast.lat);
        this._northEast.lng = Math.max(ne2.lng, this._northEast.lng);
      }
      return this;
    }

    pad(bufferRatio) {
      const sw = this._southWest;
      const ne = this._northEast;
      const heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio;
      const widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

      return new Area(
        new GeoPoint(sw.lat - heightBuffer, sw.lng - widthBuffer),
        new GeoPoint(ne.lat + heightBuffer, ne.lng + widthBuffer)
      );
    }

    getCenter() {
      return new GeoPoint(
        (this._southWest.lat + this._northEast.lat) / 2,
        (this._southWest.lng + this._northEast.lng) / 2
      );
    }

    getSouthWest() {
      return this._southWest;
    }

    getNorthEast() {
      return this._northEast;
    }

    getNorthWest() {
      return new GeoPoint(this.getNorth(), this.getWest());
    }

    getSouthEast() {
      return new GeoPoint(this.getSouth(), this.getEast());
    }

    getWest() {
      return this._southWest.lng;
    }

    getSouth() {
      return this._southWest.lat;
    }

    getEast() {
      return this._northEast.lng;
    }

    getNorth() {
      return this._northEast.lat;
    }

    contains(obj) {
      obj = (typeof obj[0] === 'number' || obj instanceof GeoPoint || 'lat' in obj)
        ? toGeoPoint(obj)
        : toArea(obj);

      const sw = this._southWest;
      const ne = this._northEast;
      let sw2, ne2;

      if (obj instanceof Area) {
        sw2 = obj.getSouthWest();
        ne2 = obj.getNorthEast();
      } else {
        sw2 = ne2 = obj;
      }

      return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
             (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
    }

    intersects(otherArea) {
      otherArea = toArea(otherArea);
      const sw = this._southWest;
      const ne = this._northEast;
      const sw2 = otherArea.getSouthWest();
      const ne2 = otherArea.getNorthEast();

      const latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat);
      const lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

      return latIntersects && lngIntersects;
    }

    toBBoxString() {
      return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
    }

    equals(otherArea, maxMargin) {
      if (!otherArea) { return false; }
      otherArea = toArea(otherArea);
      return this._southWest.equals(otherArea.getSouthWest(), maxMargin) &&
             this._northEast.equals(otherArea.getNorthEast(), maxMargin);
    }

    isValid() {
      return !!(this._southWest && this._northEast);
    }
  }

  function toArea(a, b) {
    if (a instanceof Area) {
      return a;
    }
    return new Area(a, b);
  }

  const R$1 = 6371000; // Earth radius in meters

  class GeoPoint {
    constructor(lat, lng, alt) {
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid GeoPoint object: (${lat}, ${lng})`);
      }
      this.lat = +lat;
      this.lng = +lng;

      if (alt !== undefined) {
        this.alt = +alt;
      }
    }

    equals(other, maxMargin = 1.0E-9) {
      if (!other) { return false; }
      other = toGeoPoint(other);

      const margin = Math.max(
        Math.abs(this.lat - other.lat),
        Math.abs(this.lng - other.lng)
      );

      return margin <= maxMargin;
    }

    toString(precision) {
      return `GeoPoint(${formatNum(this.lat, precision)}, ${formatNum(this.lng, precision)})`;
    }

    distanceTo(other) {
      other = toGeoPoint(other);
      const rad = Math.PI / 180;
      const lat1 = this.lat * rad;
      const lat2 = other.lat * rad;
      const sinDLat = Math.sin((other.lat - this.lat) * rad / 2);
      const sinDLon = Math.sin((other.lng - this.lng) * rad / 2);
      const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R$1 * c;
    }

    // wrap() will be implemented later with the ProjectionSystem

    toArea(sizeInMeters) {
      const latAccuracy = 180 * sizeInMeters / 40075017;
      const lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

      return toArea(
        [this.lat - latAccuracy, this.lng - lngAccuracy],
        [this.lat + latAccuracy, this.lng + lngAccuracy]
      );
    }

    clone() {
      return new GeoPoint(this.lat, this.lng, this.alt);
    }
  }

  function toGeoPoint(a, b, c) {
    if (a instanceof GeoPoint) {
      return a;
    }
    if (isArray(a) && typeof a[0] !== 'object') {
      if (a.length === 3) {
        return new GeoPoint(a[0], a[1], a[2]);
      }
      if (a.length === 2) {
        return new GeoPoint(a[0], a[1]);
      }
      return null;
    }
    if (a === undefined || a === null) {
      return a;
    }
    if (typeof a === 'object' && 'lat' in a) {
      return new GeoPoint(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
    }
    if (b === undefined) {
      return null;
    }
    return new GeoPoint(a, b, c);
  }

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

  class SurfaceManager {
    constructor(engine) {
      this.engine = engine;
      this.surfaces = [];
    }

    mount(surface) {
      this.surfaces.push(surface);
      if (surface.onMount) {
        surface.onMount();
      }
      this.engine.renderPipeline.render();
    }

    unmount(surface) {
      const index = this.surfaces.indexOf(surface);
      if (index > -1) {
        if (surface.onUnmount) {
          surface.onUnmount();
        }
        this.surfaces.splice(index, 1);
        this.engine.renderPipeline.render();
      }
    }
  }

  class GeoLine {
    constructor(points) {
      this.points = points;
    }
  }

  class GeoPolygon {
    constructor(points) {
      this.points = points;
    }
  }

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

  class InteractionManager {
    constructor(engine) {
      this.engine = engine;
      this._behaviors = {};
      this._events = [
        'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
        'mousemove', 'contextmenu', 'wheel'
      ];
    }

    add(behavior, name) {
      this._behaviors[name] = behavior;
      // By default, behaviors are not enabled until explicitly told to do so.
    }

    enable(name) {
      const behavior = this._behaviors[name];
      if (behavior) {
        behavior.enable();
      }
    }

    disable(name) {
      const behavior = this._behaviors[name];
      if (behavior) {
        behavior.disable();
      }
    }

    _initEvents() {
      const container = this.engine.container;
      for (const event of this._events) {
        container.addEventListener(event, this._handleEvent.bind(this));
      }
    }

    _handleEvent(e) {
      // This is a simplified event delegation model.
      // A more robust implementation might involve a priority system for behaviors.
      for (const name in this._behaviors) {
        const behavior = this._behaviors[name];
        if (behavior.enabled()) {
          // Pass the event to the behavior's event handler, if it exists.
          const handler = behavior[e.type];
          if (handler && typeof handler === 'function') {
            handler.call(behavior, e);
          }
        }
      }
    }
  }

  /**
   * The base class for all user interaction handlers (behaviors) in Atlas.js.
   * It provides a standard interface for enabling and disabling interactions.
   */
  class Behavior {
    constructor(engine) {
      this.engine = engine;
      this._enabled = false;
    }

    /**
     * Enables the behavior. This method should be implemented by subclasses
     * to add the necessary event listeners.
     */
    enable() {
      if (this._enabled) { return; }
      this._enabled = true;
      this.addHooks();
    }

    /**
     * Disables the behavior. This method should be implemented by subclasses
     * to remove the event listeners.
     */
    disable() {
      if (!this._enabled) { return; }
      this._enabled = false;
      this.removeHooks();
    }

    /**
     * Returns true if the behavior is currently enabled.
     * @returns {boolean}
     */
    enabled() {
      return this._enabled;
    }

    /**
     * Placeholder method for adding event listeners.
     * Must be implemented by subclasses.
     */
    addHooks() {
      throw new Error('The addHooks() method must be implemented by subclasses.');
    }

    /**
     * Placeholder method for removing event listeners.
     * Must be implemented by subclasses.
     */
    removeHooks() {
      throw new Error('The removeHooks() method must be implemented by subclasses.');
    }
  }

  class DragPan extends Behavior {
    constructor(engine) {
      super(engine);
      this._isDragging = false;
      this._lastPos = null;
    }

    addHooks() {
      this.engine.container.addEventListener('mousedown', this._onMouseDown.bind(this));
      this.engine.container.addEventListener('mouseup', this._onMouseUp.bind(this));
      this.engine.container.addEventListener('mousemove', this._onMouseMove.bind(this));
    }

    removeHooks() {
      this.engine.container.removeEventListener('mousedown', this._onMouseDown.bind(this));
      this.engine.container.removeEventListener('mouseup', this._onMouseUp.bind(this));
      this.engine.container.removeEventListener('mousemove', this._onMouseMove.bind(this));
    }

    _onMouseDown(e) {
      if (e.button !== 0) { return; } // Only handle left-clicks
      this._isDragging = true;
      this._lastPos = { x: e.clientX, y: e.clientY };
      this.engine.container.style.cursor = 'grabbing';
    }

    _onMouseUp() {
      this._isDragging = false;
      this.engine.container.style.cursor = 'grab';
    }

    _onMouseMove(e) {
      if (!this._isDragging) { return; }

      const pos = { x: e.clientX, y: e.clientY };
      const offset = {
        x: this._lastPos.x - pos.x,
        y: this._lastPos.y - pos.y
      };

      this.engine.viewport.panBy(offset);
      this._lastPos = pos;
    }
  }

  class ScrollWheelZoom extends Behavior {
    addHooks() {
      this.engine.container.addEventListener('wheel', this._onWheel.bind(this));
    }

    removeHooks() {
      this.engine.container.removeEventListener('wheel', this._onWheel.bind(this));
    }

    _onWheel(e) {
      e.preventDefault();

      const delta = e.deltaY;
      if (delta > 0) {
        this.engine.viewport.zoomOut();
      } else if (delta < 0) {
        this.engine.viewport.zoomIn();
      }
    }
  }

  class WidgetSystem {
    constructor(engine) {
      this.engine = engine;
      this._widgets = [];
      this._corners = {};
      this._initLayout();
    }

    add(widget) {
      this._widgets.push(widget);
      widget._container = widget.onAdd(this.engine);

      const pos = widget.options.position || 'topright';
      const corner = this._corners[pos];

      if (corner) {
        if (pos.includes('bottom')) {
          corner.insertBefore(widget.getContainer(), corner.firstChild);
        } else {
          corner.appendChild(widget.getContainer());
        }
      }
      return this;
    }

    remove(widget) {
      const index = this._widgets.indexOf(widget);
      if (index > -1) {
        this._widgets.splice(index, 1);

        const container = widget.getContainer();
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }

        if (widget.onRemove) {
          widget.onRemove(this.engine);
        }
      }
      return this;
    }

    _initLayout() {
      const container = this.engine.container;

      this._controlContainer = document.createElement('div');
      this._controlContainer.className = 'atlas-widget-container';
      container.appendChild(this._controlContainer);

      this._createCorner('top', 'left');
      this._createCorner('top', 'right');
      this._createCorner('bottom', 'left');
      this._createCorner('bottom', 'right');
    }

    _createCorner(vSide, hSide) {
      const className = `atlas-widget-${vSide} atlas-widget-${hSide}`;
      const corner = document.createElement('div');
      corner.className = className;
      this._corners[vSide + hSide] = corner;
      this._controlContainer.appendChild(corner);
    }
  }

  /**
   * The base class for all UI components (widgets) in Atlas.js.
   * It provides a standard interface for widgets to be added to and removed from the map.
   */
  class Widget {
    constructor(engine, options = {}) {
      this.engine = engine;
      this.options = { ...options };
      this._container = null;
    }

    /**
     * Called when the widget is added to the map by the WidgetSystem.
     * This method must be implemented by subclasses and should return the widget's DOM container.
     * @param {AtlasEngine} engine - The main engine instance.
     * @returns {HTMLElement} The widget's container element.
     */
    onAdd(engine) {
      throw new Error('The onAdd() method must be implemented by subclasses.');
    }

    /**
     * Called when the widget is removed from the map.
     * Subclasses can implement this method to perform any necessary cleanup.
     * @param {AtlasEngine} engine - The main engine instance.
     */
    onRemove(engine) {
      // Optional: To be implemented by subclasses for cleanup logic.
    }

    /**
     * Returns the widget's main DOM container.
     * @returns {HTMLElement} The container element.
     */
    getContainer() {
      return this._container;
    }
  }

  class ZoomWidget extends Widget {
    constructor(engine, options) {
      super(engine, {
        position: 'topleft',
        zoomInText: '+',
        zoomInTitle: 'Zoom in',
        zoomOutText: '−',
        zoomOutTitle: 'Zoom out',
        ...options
      });
    }

    onAdd(engine) {
      const container = document.createElement('div');
      container.className = 'atlas-zoom-widget atlas-bar';

      this._zoomInButton = this._createButton(this.options.zoomInText, this.options.zoomInTitle, 'atlas-zoom-in', container, () => this.engine.viewport.zoomIn());
      this._zoomOutButton = this._createButton(this.options.zoomOutText, this.options.zoomOutTitle, 'atlas-zoom-out', container, () => this.engine.viewport.zoomOut());

      this.engine.stateManager.watch('viewport.zoom', () => this._updateDisabled());
      this._updateDisabled();

      return container;
    }

    _createButton(html, title, className, container, fn) {
      const link = document.createElement('a');
      link.innerHTML = html;
      link.href = '#';
      link.title = title;
      link.className = className;
      link.setAttribute('role', 'button');
      link.setAttribute('aria-label', title);

      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      });

      container.appendChild(link);
      return link;
    }

    _updateDisabled() {
      const zoom = this.engine.stateManager.get('viewport.zoom');
      const minZoom = this.engine.stateManager.get('viewport.minZoom') || 0;
      const maxZoom = this.engine.stateManager.get('viewport.maxZoom') || 18;

      this._zoomInButton.classList.remove('atlas-disabled');
      this._zoomOutButton.classList.remove('atlas-disabled');

      if (zoom <= minZoom) {
        this._zoomOutButton.classList.add('atlas-disabled');
      }
      if (zoom >= maxZoom) {
        this._zoomInButton.classList.add('atlas-disabled');
      }
    }
  }

  class AtlasEngine {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id "${containerId}" not found.`);
      }

      // Initialize core components
      this.stateManager = new StateManager();
      this.commandBus = new CommandBus();
      this.projection = options.projection || new EPSG3857();
      this.viewport = new ViewportManager(this, options);
      this.surfaces = new SurfaceManager(this);
      this.renderPipeline = new RenderPipeline(this);
      this.widgets = new WidgetSystem(this);
      this.interaction = new InteractionManager(this);

      // Add default widgets and behaviors
      this.widgets.add(new ZoomWidget(this));
      this.interaction.add(new DragPan(this), 'dragPan');
      this.interaction.add(new ScrollWheelZoom(this), 'scrollWheelZoom');

      // Enable default behaviors
      this.interaction.enable('dragPan');
      this.interaction.enable('scrollWheelZoom');

      this.interaction._initEvents();
    }
  }

  class Surface {
    constructor(engine) {
      this.engine = engine;
    }

    onMount() {
      // Optional: To be implemented by subclasses for setup logic
    }

    onUnmount() {
      // Optional: To be implemented by subclasses for teardown logic
    }

    render(renderer) {
      // This method must be implemented by subclasses
      throw new Error('The render() method must be implemented by subclasses.');
    }
  }

  class TileSurface extends Surface {
    constructor(engine, options) {
      super(engine);
      this.options = {
        tileSize: 256,
        subdomains: 'abc',
        minZoom: 0,
        maxZoom: 18,
        ...options,
      };
      this._tiles = {};

      // Watch for changes in the viewport to trigger re-renders
      this.engine.stateManager.watch('viewport.center', () => this.engine.renderPipeline.render());
      this.engine.stateManager.watch('viewport.zoom', () => this.engine.renderPipeline.render());
    }

    _getTileUrl(coords) {
      const data = {
        x: coords.x,
        y: coords.y,
        z: coords.z,
        s: this.options.subdomains[Math.floor(Math.random() * this.options.subdomains.length)],
      };
      return this.options.urlTemplate.replace(/\{(\w+)\}/g, (match, key) => data[key]);
    }

    render(renderer) {
      const zoom = Math.round(this.engine.stateManager.get('viewport.zoom'));
      if (zoom < this.options.minZoom || zoom > this.options.maxZoom || !this.options.urlTemplate) {
        return;
      }

      this.engine.stateManager.get('viewport.center');
      const projection = this.engine.projection;
      projection.scale(zoom);
      const tileSize = this.options.tileSize;

      const pixelOrigin = this.engine.viewport.getPixelOrigin();
      const mapSize = this.engine.viewport.getSize();

      const tileRange = this._getTileRange(pixelOrigin, mapSize, tileSize);

      for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
        for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
          const tileCoords = { x: i, y: j, z: zoom };
          const tileId = `${tileCoords.x}:${tileCoords.y}:${tileCoords.z}`;

          if (!this._tiles[tileId]) {
            this._createTile(tileCoords);
          }

          if (this._tiles[tileId] && this._tiles[tileId].complete && this._tiles[tileId].naturalWidth !== 0) {
            const tile = this._tiles[tileId];
            const tilePos = this._getTilePos(tileCoords, pixelOrigin, tileSize);
            renderer.drawImage(tile, tilePos.x, tilePos.y, tileSize, tileSize);
          }
        }
      }
    }

    _getTilePos(coords, pixelOrigin, tileSize) {
      const x = (coords.x * tileSize) - pixelOrigin.x;
      const y = (coords.y * tileSize) - pixelOrigin.y;
      return {x, y};
    }

    _getTileRange(pixelOrigin, mapSize, tileSize) {
        const min = pixelOrigin.divideBy(tileSize).floor();
        const max = pixelOrigin.add(mapSize).divideBy(tileSize).floor();
        return {min, max};
    }

    _createTile(coords) {
      const tileId = `${coords.x}:${coords.y}:${coords.z}`;
      if (this._tiles[tileId]) {
        return;
      }

      const tile = new Image();
      tile.crossOrigin = 'Anonymous';
      this._tiles[tileId] = tile;

      tile.onload = () => {
        this.engine.renderPipeline.render();
      };

      tile.onerror = () => {
        console.error(`Failed to load tile: ${tile.src}`);
      };

      tile.src = this._getTileUrl(coords);
    }
  }

  class VectorSurface extends Surface {
    constructor(engine, features = []) {
      super(engine);
      this.features = features;

      // Watch for changes in the viewport to trigger re-renders
      this.engine.stateManager.watch('viewport.center', () => this.engine.renderPipeline.render());
      this.engine.stateManager.watch('viewport.zoom', () => this.engine.renderPipeline.render());
    }

    addFeature(feature) {
      this.features.push(feature);
      this.engine.renderPipeline.render();
    }

    removeFeature(feature) {
      const index = this.features.indexOf(feature);
      if (index > -1) {
        this.features.splice(index, 1);
        this.engine.renderPipeline.render();
      }
    }

    render(renderer) {
      for (const feature of this.features) {
        this.engine.renderPipeline.draw(renderer, feature);
      }
    }
  }

  class Feature {
    constructor(geometry, properties = {}, style = {}) {
      this.geometry = geometry;
      this.properties = properties;
      this.style = {
        color: 'blue',
        weight: 3,
        fillColor: 'blue',
        fillOpacity: 0.2,
        ...style
      };
    }
  }

  exports.Area = Area;
  exports.AtlasEngine = AtlasEngine;
  exports.Feature = Feature;
  exports.GeoLine = GeoLine;
  exports.GeoPoint = GeoPoint;
  exports.GeoPolygon = GeoPolygon;
  exports.PixelPoint = PixelPoint;
  exports.TileSurface = TileSurface;
  exports.VectorSurface = VectorSurface;
  exports["default"] = AtlasEngine;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=atlas-v2.js.map
