import { extend, create, setOptions, stamp, isArray, formatNum, wrapNum, falseFn, bind } from './atlas-utils.js';
import { Events } from './atlas-events.js';
import { DomUtil, DomEvent, create$1 as create$1_dom } from './atlas-dom.js';
import { Browser } from './atlas-browser.js';
import { PosAnimation } from './atlas-animation.js';
import { Point, toPoint, Bounds, toBounds, LatLng, toLatLng, LatLngBounds, toLatLngBounds } from './atlas-geometry.js';
import { LineUtil, PolyUtil } from './atlas-geometry.js';

export function Class() {}

Class.extend = function (props) {
  var NewClass = function () {
    setOptions(this);
    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }
    this.callInitHooks();
  };
  var parentProto = NewClass.__super__ = this.prototype;
  var proto = create(parentProto);
  proto.constructor = NewClass;
  NewClass.prototype = proto;
  for (var i in this) {
    if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
      NewClass[i] = this[i];
    }
  }
  if (props.statics) {
    extend(NewClass, props.statics);
  }
  if (props.includes) {
    checkDeprecatedMixinEvents(props.includes);
    extend.apply(null, [proto].concat(props.includes));
  }
  extend(proto, props);
  delete proto.statics;
  delete proto.includes;
  if (proto.options) {
    proto.options = parentProto.options ? create(parentProto.options) : {};
    extend(proto.options, props.options);
  }
  proto._initHooks = [];
  proto.callInitHooks = function () {
    if (this._initHooksCalled) { return; }
    if (parentProto.callInitHooks) {
      parentProto.callInitHooks.call(this);
    }
    this._initHooksCalled = true;
    for (var i = 0, len = proto._initHooks.length; i < len; i++) {
      proto._initHooks[i].call(this);
    }
  };
  return NewClass;
};

Class.include = function (props) {
  var parentOptions = this.prototype.options;
  extend(this.prototype, props);
  if (props.options) {
    this.prototype.options = parentOptions;
    this.mergeOptions(props.options);
  }
  return this;
};

Class.mergeOptions = function (options) {
  extend(this.prototype.options, options);
  return this;
};

Class.addInitHook = function (fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  var init = typeof fn === 'function' ? fn : function () {
    this[fn].apply(this, args);
  };
  this.prototype._initHooks = this.prototype._initHooks || [];
  this.prototype._initHooks.push(init);
  return this;
};

function checkDeprecatedMixinEvents(includes) {
  if (typeof L === 'undefined' || !L || !L.Mixin) { return; }
  includes = isArray(includes) ? includes : [includes];
  for (var i = 0; i < includes.length; i++) {
    if (includes[i] === atlas.Mixin.Events) {
      console.warn('Deprecated include of atlas.Mixin.Events: ' +
        'this property will be removed in future releases, ' +
        'please inherit from atlas.Evented instead.', new Error().stack);
    }
  }
}

export var Evented = Class.extend(Events);

export var CRS = {
  latLngToPoint: function (latlng, zoom) {
    var projectedPoint = this.projection.project(latlng),
        scale = this.scale(zoom);
    return this.transformation._transform(projectedPoint, scale);
  },
  pointToLatLng: function (point, zoom) {
    var scale = this.scale(zoom),
        untransformedPoint = this.transformation.untransform(point, scale);
    return this.projection.unproject(untransformedPoint);
  },
  project: function (latlng) {
    return this.projection.project(latlng);
  },
  unproject: function (point) {
    return this.projection.unproject(point);
  },
  scale: function (zoom) {
    return 256 * Math.pow(2, zoom);
  },
  zoom: function (scale) {
    return Math.log(scale / 256) / Math.LN2;
  },
  getProjectedBounds: function (zoom) {
    if (this.infinite) { return null; }
    var b = this.projection.bounds,
        s = this.scale(zoom),
        min = this.transformation.transform(b.min, s),
        max = this.transformation.transform(b.max, s);
    return new Bounds(min, max);
  },
  infinite: false,
  wrapLatLng: function (latlng) {
    var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
        lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
        alt = latlng.alt;
    return new LatLng(lat, lng, alt);
  },
  wrapLatLngBounds: function (bounds) {
    var center = bounds.getCenter(),
        newCenter = this.wrapLatLng(center),
        latShift = center.lat - newCenter.lat,
        lngShift = center.lng - newCenter.lng;
    if (latShift === 0 && lngShift === 0) {
      return bounds;
    }
    var sw = bounds.getSouthWest(),
        ne = bounds.getNorthEast(),
        newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
        newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);
    return new LatLngBounds(newSw, newNe);
  }
};

export var Earth = extend({}, CRS, {
  wrapLng: [-180, 180],
  R: 6371000,
  distance: function (latlng1, latlng2) {
    var rad = Math.PI / 180,
        lat1 = latlng1.lat * rad,
        lat2 = latlng2.lat * rad,
        sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
        sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
        a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.R * c;
  }
});

var earthRadius = 6378137;
export var SphericalMercator = {
  R: earthRadius,
  MAX_LATITUDE: 85.0511287798,
  project: function (latlng) {
    var d = Math.PI / 180,
        max = this.MAX_LATITUDE,
        lat = Math.max(Math.min(max, latlng.lat), -max),
        sin = Math.sin(lat * d);
    return new Point(
      this.R * latlng.lng * d,
      this.R * Math.log((1 + sin) / (1 - sin)) / 2);
  },
  unproject: function (point) {
    var d = 180 / Math.PI;
    return new LatLng(
      (2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
      point.x * d / this.R);
  },
  bounds: (function () {
    var d = earthRadius * Math.PI;
    return new Bounds([-d, -d], [d, d]);
  })()
};

export function Transformation(a, b, c, d) {
  if (isArray(a)) {
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

Transformation.prototype = {
  transform: function (point, scale) {
    return this._transform(point.clone(), scale);
  },
  _transform: function (point, scale) {
    scale = scale || 1;
    point.x = scale * (this._a * point.x + this._b);
    point.y = scale * (this._c * point.y + this._d);
    return point;
  },
  untransform: function (point, scale) {
    scale = scale || 1;
    return new Point(
            (point.x / scale - this._b) / this._a,
            (point.y / scale - this._d) / this._c);
  }
};

export function toTransformation(a, b, c, d) {
  return new Transformation(a, b, c, d);
}

export var EPSG3857 = extend({}, Earth, {
  code: 'EPSG:3857',
  projection: SphericalMercator,
  transformation: (function () {
    var scale = 0.5 / (Math.PI * SphericalMercator.R);
    return toTransformation(scale, 0.5, -scale, 0.5);
  }())
});

export var EPSG900913 = extend({}, EPSG3857, {
  code: 'EPSG:900913'
});

export var Map = Evented.extend({
  options: {
    crs: EPSG3857,
    center: undefined,
    zoom: undefined,
    minZoom: undefined,
    maxZoom: undefined,
    layers: [],
    maxBounds: undefined,
    renderer: undefined,
    zoomAnimation: true,
    zoomAnimationThreshold: 4,
    fadeAnimation: true,
    markerZoomAnimation: true,
    transform3DLimit: 8388608,
    zoomSnap: 1,
    zoomDelta: 1,
    trackResize: true
  },
  initialize: function (id, options) {
    options = setOptions(this, options);
    this._handlers = [];
    this._layers = {};
    this._zoomBoundLayers = {};
    this._sizeChanged = true;
    this._initContainer(id);
    this._initLayout();
    this._onResize = bind(this._onResize, this);
    this._initEvents();
    if (options.maxBounds) {
      this.setMaxBounds(options.maxBounds);
    }
    if (options.zoom !== undefined) {
      this._zoom = this._limitZoom(options.zoom);
    }
    if (options.center && options.zoom !== undefined) {
      this.setView(toLatLng(options.center), options.zoom, {reset: true});
    }
    this.callInitHooks();
    this._zoomAnimated = DomUtil.TRANSITION && Browser.any3d && !Browser.mobileOpera &&
        this.options.zoomAnimation;
    if (this._zoomAnimated) {
      this._createAnimProxy();
      DomEvent.on(this._proxy, DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
    }
    this._addLayers(this.options.layers);
  },
  setView: function (center, zoom, options) {
    zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
    center = this._limitCenter(toLatLng(center), zoom, this.options.maxBounds);
    options = options || {};
    this._stop();
    if (this._loaded && !options.reset && options !== true) {
      if (options.animate !== undefined) {
        options.zoom = extend({animate: options.animate}, options.zoom);
        options.pan = extend({animate: options.animate, duration: options.duration}, options.pan);
      }
      var moved = (this._zoom !== zoom) ?
        this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
        this._tryAnimatedPan(center, options.pan);
      if (moved) {
        clearTimeout(this._sizeTimer);
        return this;
      }
    }
    this._resetView(center, zoom, options.pan && options.pan.noMoveStart);
    return this;
  },
  setZoom: function (zoom, options) {
    if (!this._loaded) {
      this._zoom = zoom;
      return this;
    }
    return this.setView(this.getCenter(), zoom, {zoom: options});
  },
  zoomIn: function (delta, options) {
    delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
    return this.setZoom(this._zoom + delta, options);
  },
  zoomOut: function (delta, options) {
    delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
    return this.setZoom(this._zoom - delta, options);
  },
  setZoomAround: function (latlng, zoom, options) {
    var scale = this.getZoomScale(zoom),
        viewHalf = this.getSize().divideBy(2),
        containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),
        centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
        newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
    return this.setView(newCenter, zoom, {zoom: options});
  },
  _getBoundsCenterZoom: function (bounds, options) {
    options = options || {};
    bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);
    var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
        paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
        zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
    zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;
    if (zoom === Infinity) {
      return {
        center: bounds.getCenter(),
        zoom: zoom
      };
    }
    var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),
        swPoint = this.project(bounds.getSouthWest(), zoom),
        nePoint = this.project(bounds.getNorthEast(), zoom),
        center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);
    return {
      center: center,
      zoom: zoom
    };
  },
  fitBounds: function (bounds, options) {
    bounds = toLatLngBounds(bounds);
    if (!bounds.isValid()) {
      throw new Error('Bounds are not valid.');
    }
    var target = this._getBoundsCenterZoom(bounds, options);
    return this.setView(target.center, target.zoom, options);
  },
  fitWorld: function (options) {
    return this.fitBounds([[-90, -180], [90, 180]], options);
  },
  panTo: function (center, options) {
    return this.setView(center, this._zoom, {pan: options});
  },
  panBy: function (offset, options) {
    offset = toPoint(offset).round();
    options = options || {};
    if (!offset.x && !offset.y) {
      return this.fire('moveend');
    }
    if (options.animate !== true && !this.getSize().contains(offset)) {
      this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
      return this;
    }
    if (!this._panAnim) {
      this._panAnim = new PosAnimation();
      this._panAnim.on({
        'step': this._onPanTransitionStep,
        'end': this._onPanTransitionEnd
      }, this);
    }
    if (!options.noMoveStart) {
      this.fire('movestart');
    }
    if (options.animate !== false) {
      DomUtil.addClass(this._mapPane, 'atlas-pan-anim');
      var newPos = DomUtil.getPosition(this._mapPane).subtract(offset).round();
      this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
    } else {
      this._rawPanBy(offset);
      this.fire('move').fire('moveend');
    }
    return this;
  },
  flyTo: function (targetCenter, targetZoom, options) {
    options = options || {};
    if (options.animate === false || !Browser.any3d) {
      return this.setView(targetCenter, targetZoom, options);
    }
    this._stop();
    var from = this.project(this.getCenter()),
        to = this.project(targetCenter),
        size = this.getSize(),
        startZoom = this._zoom;
    targetCenter = toLatLng(targetCenter);
    targetZoom = targetZoom === undefined ? startZoom : targetZoom;
    var w0 = Math.max(size.x, size.y),
        w1 = w0 * this.getZoomScale(startZoom, targetZoom),
        u1 = (to.distanceTo(from)) || 1,
        rho = 1.42,
        rho2 = rho * rho;
    function r(i) {
      var s1 = i ? -1 : 1,
          s2 = i ? w1 : w0,
          t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
          b1 = 2 * s2 * rho2 * u1,
          b = t1 / b1,
          sq = Math.sqrt(b * b + 1) - b;
          var log = sq < 0.000000001 ? -18 : Math.log(sq);
      return log;
    }
    function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
    function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
    function tanh(n) { return sinh(n) / cosh(n); }
    var r0 = r(0);
    function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
    function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }
    var start = Date.now(),
        S = (r(1) - r0) / rho,
        duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;
    function frame() {
      var t = (Date.now() - start) / duration,
          s = easeOut(t) * S;
      if (t <= 1) {
        this._flyToFrame = DomUtil.requestAnimFrame(frame, this);
        this._move(
          this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
          this.getScaleZoom(w0 / w(s), startZoom),
          {flyTo: true});
      } else {
        this
          ._move(targetCenter, targetZoom)
          ._moveEnd(true);
      }
    }
    this._moveStart(true, options.noMoveStart);
    frame.call(this);
    return this;
  },
  flyToBounds: function (bounds, options) {
    var target = this._getBoundsCenterZoom(bounds, options);
    return this.flyTo(target.center, target.zoom, options);
  },
  setMaxBounds: function (bounds) {
    bounds = toLatLngBounds(bounds);
    if (this.listens('moveend', this._panInsideMaxBounds)) {
      this.off('moveend', this._panInsideMaxBounds);
    }
    if (!bounds.isValid()) {
      this.options.maxBounds = null;
      return this;
    }
    this.options.maxBounds = bounds;
    if (this._loaded) {
      this._panInsideMaxBounds();
    }
    return this.on('moveend', this._panInsideMaxBounds);
  },
  setMinZoom: function (zoom) {
    var oldZoom = this.options.minZoom;
    this.options.minZoom = zoom;
    if (this._loaded && oldZoom !== zoom) {
      this.fire('zoomlevelschange');
      if (this.getZoom() < this.options.minZoom) {
        return this.setZoom(zoom);
      }
    }
    return this;
  },
  setMaxZoom: function (zoom) {
    var oldZoom = this.options.maxZoom;
    this.options.maxZoom = zoom;
    if (this._loaded && oldZoom !== zoom) {
      this.fire('zoomlevelschange');
      if (this.getZoom() > this.options.maxZoom) {
        return this.setZoom(zoom);
      }
    }
    return this;
  },
  panInsideBounds: function (bounds, options) {
    this._enforcingBounds = true;
    var center = this.getCenter(),
        newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));
    if (!center.equals(newCenter)) {
      this.panTo(newCenter, options);
    }
    this._enforcingBounds = false;
    return this;
  },
  panInside: function (latlng, options) {
    options = options || {};
    var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
        paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
        pixelCenter = this.project(this.getCenter()),
        pixelPoint = this.project(latlng),
        pixelBounds = this.getPixelBounds(),
        paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]),
        paddedSize = paddedBounds.getSize();
    if (!paddedBounds.contains(pixelPoint)) {
      this._enforcingBounds = true;
      var centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
      var offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
      pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
      pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
      this.panTo(this.unproject(pixelCenter), options);
      this._enforcingBounds = false;
    }
    return this;
  },
  invalidateSize: function (options) {
    if (!this._loaded) { return this; }
    options = extend({
      animate: false,
      pan: true
    }, options === true ? {animate: true} : options);
    var oldSize = this.getSize();
    this._sizeChanged = true;
    this._lastCenter = null;
    var newSize = this.getSize(),
        oldCenter = oldSize.divideBy(2).round(),
        newCenter = newSize.divideBy(2).round(),
        offset = oldCenter.subtract(newCenter);
    if (!offset.x && !offset.y) { return this; }
    if (options.animate && options.pan) {
      this.panBy(offset);
    } else {
      if (options.pan) {
        this._rawPanBy(offset);
      }
      this.fire('move');
      if (options.debounceMoveend) {
        clearTimeout(this._sizeTimer);
        this._sizeTimer = setTimeout(bind(this.fire, this, 'moveend'), 200);
      } else {
        this.fire('moveend');
      }
    }
    return this.fire('resize', {
      oldSize: oldSize,
      newSize: newSize
    });
  },
  stop: function () {
    this.setZoom(this._limitZoom(this._zoom));
    if (!this.options.zoomSnap) {
      this.fire('viewreset');
    }
    return this._stop();
  },
  locate: function (options) {
    options = this._locateOptions = extend({
      timeout: 10000,
      watch: false
    }, options);
    if (!('geolocation' in navigator)) {
      this._handleGeolocationError({
        code: 0,
        message: 'Geolocation not supported.'
      });
      return this;
    }
    var onResponse = bind(this._handleGeolocationResponse, this),
        onError = bind(this._handleGeolocationError, this);
    if (options.watch) {
      this._locationWatchId =
              navigator.geolocation.watchPosition(onResponse, onError, options);
    } else {
      navigator.geolocation.getCurrentPosition(onResponse, onError, options);
    }
    return this;
  },
  stopLocate: function () {
    if (navigator.geolocation && navigator.geolocation.clearWatch) {
      navigator.geolocation.clearWatch(this._locationWatchId);
    }
    if (this._locateOptions) {
      this._locateOptions.setView = false;
    }
    return this;
  },
  _handleGeolocationError: function (error) {
    if (!this._container._atlas_id) { return; }
    var c = error.code,
        message = error.message ||
                (c === 1 ? 'permission denied' :
                (c === 2 ? 'position unavailable' : 'timeout'));
    if (this._locateOptions.setView && !this._loaded) {
      this.fitWorld();
    }
    this.fire('locationerror', {
      code: c,
      message: 'Geolocation error: ' + message + '.'
    });
  },
  _handleGeolocationResponse: function (pos) {
    if (!this._container._atlas_id) { return; }
    var lat = pos.coords.latitude,
        lng = pos.coords.longitude,
        latlng = new LatLng(lat, lng),
        bounds = latlng.toBounds(pos.coords.accuracy * 2),
        options = this._locateOptions;
    if (options.setView) {
      var zoom = this.getBoundsZoom(bounds);
      this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
    }
    var data = {
      latlng: latlng,
      bounds: bounds,
      timestamp: pos.timestamp
    };
    for (var i in pos.coords) {
      if (typeof pos.coords[i] === 'number') {
        data[i] = pos.coords[i];
      }
    }
    this.fire('locationfound', data);
  },
  addHandler: function (name, HandlerClass) {
    if (!HandlerClass) { return this; }
    var handler = this[name] = new HandlerClass(this);
    this._handlers.push(handler);
    if (this.options[name]) {
      handler.enable();
    }
    return this;
  },
  remove: function () {
    this._initEvents(true);
    if (this.options.maxBounds) { this.off('moveend', this._panInsideMaxBounds); }
    if (this._containerId !== this._container._atlas_id) {
      throw new Error('Map container is being reused by another instance');
    }
    try {
      delete this._container._atlas_id;
      delete this._containerId;
    } catch (e) {
      this._container._atlas_id = undefined;
      this._containerId = undefined;
    }
    if (this._locationWatchId !== undefined) {
      this.stopLocate();
    }
    this._stop();
    DomUtil.remove(this._mapPane);
    if (this._clearControlPos) {
      this._clearControlPos();
    }
    if (this._resizeRequest) {
      DomUtil.cancelAnimFrame(this._resizeRequest);
      this._resizeRequest = null;
    }
    this._clearHandlers();
    if (this._loaded) {
      this.fire('unload');
    }
    var i;
    for (i in this._layers) {
      this._layers[i].remove();
    }
    for (i in this._panes) {
      DomUtil.remove(this._panes[i]);
    }
    this._layers = [];
    this._panes = [];
    delete this._mapPane;
    delete this._renderer;
    return this;
  },
  createPane: function (name, container) {
    var className = 'atlas-pane' + (name ? ' atlas-' + name.replace('Pane', '') + '-pane' : ''),
        pane = create$1_dom('div', className, container || this._mapPane);
    if (name) {
      this._panes[name] = pane;
    }
    return pane;
  },
  getCenter: function () {
    this._checkIfLoaded();
    if (this._lastCenter && !this._moved()) {
      return this._lastCenter.clone();
    }
    return this.layerPointToLatLng(this._getCenterLayerPoint());
  },
  getZoom: function () {
    return this._zoom;
  },
  getBounds: function () {
    var bounds = this.getPixelBounds(),
        sw = this.unproject(bounds.getBottomLeft()),
        ne = this.unproject(bounds.getTopRight());
    return new LatLngBounds(sw, ne);
  },
  getMinZoom: function () {
    return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
  },
  getMaxZoom: function () {
    return this.options.maxZoom === undefined ?
      (this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
      this.options.maxZoom;
  },
  getBoundsZoom: function (bounds, inside, padding) {
    bounds = toLatLngBounds(bounds);
    padding = toPoint(padding || [0, 0]);
    var zoom = this.getZoom() || 0,
        min = this.getMinZoom(),
        max = this.getMaxZoom(),
        nw = bounds.getNorthWest(),
        se = bounds.getSouthEast(),
        size = this.getSize().subtract(padding),
        boundsSize = toBounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
        snap = Browser.any3d ? this.options.zoomSnap : 1,
        scalex = size.x / boundsSize.x,
        scaley = size.y / boundsSize.y,
        scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
    zoom = this.getScaleZoom(scale, zoom);
    if (snap) {
      zoom = Math.round(zoom / (snap / 100)) * (snap / 100);
      zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
    }
    return Math.max(min, Math.min(max, zoom));
  },
  getSize: function () {
    if (!this._size || this._sizeChanged) {
      this._size = new Point(
        this._container.clientWidth || 0,
        this._container.clientHeight || 0);
      this._sizeChanged = false;
    }
    return this._size.clone();
  },
  getPixelBounds: function (center, zoom) {
    var topLeftPoint = this._getTopLeftPoint(center, zoom);
    return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
  },
  getPixelOrigin: function () {
    this._checkIfLoaded();
    return this._pixelOrigin;
  },
  getPixelWorldBounds: function (zoom) {
    return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
  },
  getPane: function (pane) {
    return typeof pane === 'string' ? this._panes[pane] : pane;
  },
  getPanes: function () {
    return this._panes;
  },
  getContainer: function () {
    return this._container;
  },
  getZoomScale: function (toZoom, fromZoom) {
    var crs = this.options.crs;
    fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
    return crs.scale(toZoom) / crs.scale(fromZoom);
  },
  getScaleZoom: function (scale, fromZoom) {
    var crs = this.options.crs;
    fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
    var zoom = crs.zoom(scale * crs.scale(fromZoom));
    return isNaN(zoom) ? Infinity : zoom;
  },
  project: function (latlng, zoom) {
    zoom = zoom === undefined ? this._zoom : zoom;
    return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
  },
  unproject: function (point, zoom) {
    zoom = zoom === undefined ? this._zoom : zoom;
    return this.options.crs.pointToLatLng(toPoint(point), zoom);
  },
  layerPointToLatLng: function (point) {
    var projectedPoint = toPoint(point).add(this.getPixelOrigin());
    return this.unproject(projectedPoint);
  },
  latLngToLayerPoint: function (latlng) {
    var projectedPoint = this.project(toLatLng(latlng))._round();
    return projectedPoint._subtract(this.getPixelOrigin());
  },
  wrapLatLng: function (latlng) {
    return this.options.crs.wrapLatLng(toLatLng(latlng));
  },
  wrapLatLngBounds: function (latlng) {
    return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
  },
  distance: function (latlng1, latlng2) {
    return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
  },
  containerPointToLayerPoint: function (point) {
    return toPoint(point).subtract(this._getMapPanePos());
  },
  layerPointToContainerPoint: function (point) {
    return toPoint(point).add(this._getMapPanePos());
  },
  containerPointToLatLng: function (point) {
    var layerPoint = this.containerPointToLayerPoint(toPoint(point));
    return this.layerPointToLatLng(layerPoint);
  },
  latLngToContainerPoint: function (latlng) {
    return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
  },
  mouseEventToContainerPoint: function (e) {
    return DomEvent.getMousePosition(e, this._container);
  },
  mouseEventToLayerPoint: function (e) {
    return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
  },
  mouseEventToLatLng: function (e) {
    return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
  },
  _initContainer: function (id) {
    var container = this._container = DomUtil.get(id);
    if (!container) {
      throw new Error('Map container not found.');
    } else if (container._atlas_id) {
      throw new Error('Map container is already initialized.');
    }
    DomEvent.on(container, 'scroll', this._onScroll, this);
    this._containerId = stamp(container);
  },
  _initLayout: function () {
    var container = this._container;
    this._fadeAnimated = this.options.fadeAnimation && Browser.any3d;
    DomUtil.addClass(container, 'atlas-container' +
      (Browser.touch ? ' atlas-touch' : '') +
      (Browser.retina ? ' atlas-retina' : '') +
      (Browser.ielt9 ? ' atlas-oldie' : '') +
      (Browser.safari ? ' atlas-safari' : '') +
      (this._fadeAnimated ? ' atlas-fade-anim' : ''));
    var position = DomUtil.getStyle(container, 'position');
    if (position !== 'absolute' && position !== 'relative' && position !== 'fixed' && position !== 'sticky') {
      container.style.position = 'relative';
    }
    this._initPanes();
    if (this._initControlPos) {
      this._initControlPos();
    }
  },
  _initPanes: function () {
    var panes = this._panes = {};
    this._paneRenderers = {};
    this._mapPane = this.createPane('mapPane', this._container);
    DomUtil.setPosition(this._mapPane, new Point(0, 0));
    this.createPane('tilePane');
    this.createPane('overlayPane');
    this.createPane('shadowPane');
    this.createPane('markerPane');
    this.createPane('tooltipPane');
    this.createPane('popupPane');
    if (!this.options.markerZoomAnimation) {
      DomUtil.addClass(panes.markerPane, 'atlas-zoom-hide');
      DomUtil.addClass(panes.shadowPane, 'atlas-zoom-hide');
    }
  },
  _resetView: function (center, zoom, noMoveStart) {
    DomUtil.setPosition(this._mapPane, new Point(0, 0));
    var loading = !this._loaded;
    this._loaded = true;
    zoom = this._limitZoom(zoom);
    this.fire('viewprereset');
    var zoomChanged = this._zoom !== zoom;
    this
      ._moveStart(zoomChanged, noMoveStart)
      ._move(center, zoom)
      ._moveEnd(zoomChanged);
    this.fire('viewreset');
    if (loading) {
      this.fire('load');
    }
  },
  _moveStart: function (zoomChanged, noMoveStart) {
    if (zoomChanged) {
      this.fire('zoomstart');
    }
    if (!noMoveStart) {
      this.fire('movestart');
    }
    return this;
  },
  _move: function (center, zoom, data, supressEvent) {
    if (zoom === undefined) {
      zoom = this._zoom;
    }
    var zoomChanged = this._zoom !== zoom;
    this._zoom = zoom;
    this._lastCenter = center;
    this._pixelOrigin = this._getNewPixelOrigin(center);
    if (!supressEvent) {
      if (zoomChanged || (data && data.pinch)) {
        this.fire('zoom', data);
      }
      this.fire('move', data);
    } else if (data && data.pinch) {
      this.fire('zoom', data);
    }
    return this;
  },
  _moveEnd: function (zoomChanged) {
    if (zoomChanged) {
      this.fire('zoomend');
    }
    return this.fire('moveend');
  },
  _stop: function () {
    DomUtil.cancelAnimFrame(this._flyToFrame);
    if (this._panAnim) {
      this._panAnim.stop();
    }
    return this;
  },
  _rawPanBy: function (offset) {
    DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
  },
  _getZoomSpan: function () {
    return this.getMaxZoom() - this.getMinZoom();
  },
  _panInsideMaxBounds: function () {
    if (!this._enforcingBounds) {
      this.panInsideBounds(this.options.maxBounds);
    }
  },
  _checkIfLoaded: function () {
    if (!this._loaded) {
      throw new Error('Set map center and zoom first.');
    }
  },
  _initEvents: function (remove) {
    this._targets = {};
    this._targets[stamp(this._container)] = this;
    var onOff = remove ? DomEvent.off : DomEvent.on;
    onOff(this._container, 'click dblclick mousedown mouseup ' +
      'mouseover mouseout mousemove contextmenu keypress keydown keyup', this._handleDOMEvent, this);
    if (this.options.trackResize) {
      onOff(window, 'resize', this._onResize, this);
    }
    if (Browser.any3d && this.options.transform3DLimit) {
      (remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    }
  },
  _onResize: function () {
    DomUtil.cancelAnimFrame(this._resizeRequest);
    this._resizeRequest = DomUtil.requestAnimFrame(
            function () { this.invalidateSize({debounceMoveend: true}); }, this);
  },
  _onScroll: function () {
    this._container.scrollTop  = 0;
    this._container.scrollLeft = 0;
  },
  _onMoveEnd: function () {
    var pos = this._getMapPanePos();
    if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
      this._resetView(this.getCenter(), this.getZoom());
    }
  },
  _findEventTargets: function (e, type) {
    var targets = [],
        target,
        isHover = type === 'mouseout' || type === 'mouseover',
        src = e.target || e.srcElement,
        dragging = false;
    while (src) {
      target = this._targets[stamp(src)];
      if (target && (type === 'click' || type === 'preclick') && this._draggableMoved(target)) {
        dragging = true;
        break;
      }
      if (target && target.listens(type, true)) {
        if (isHover && !DomEvent.isExternalTarget(src, e)) { break; }
        targets.push(target);
        if (isHover) { break; }
      }
      if (src === this._container) { break; }
      src = src.parentNode;
    }
    if (!targets.length && !dragging && !isHover && this.listens(type, true)) {
      targets = [this];
    }
    return targets;
  },
  _isClickDisabled: function (el) {
    while (el && el !== this._container) {
      if (el['_atlas_disable_click']) { return true; }
      el = el.parentNode;
    }
  },
  _handleDOMEvent: function (e) {
    var el = (e.target || e.srcElement);
    if (!this._loaded || el['_atlas_disable_events'] || e.type === 'click' && this._isClickDisabled(el)) {
      return;
    }
    var type = e.type;
    if (type === 'mousedown') {
      DomUtil.preventOutline(el);
    }
    this._fireDOMEvent(e, type);
  },
  _mouseEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],
  _fireDOMEvent: function (e, type, canvasTargets) {
    if (e.type === 'click') {
      var synth = extend({}, e);
      synth.type = 'preclick';
      this._fireDOMEvent(synth, synth.type, canvasTargets);
    }
    var targets = this._findEventTargets(e, type);
    if (canvasTargets) {
      var filtered = [];
      for (var i = 0; i < canvasTargets.length; i++) {
        if (canvasTargets[i].listens(type, true)) {
          filtered.push(canvasTargets[i]);
        }
      }
      targets = filtered.concat(targets);
    }
    if (!targets.length) { return; }
    if (type === 'contextmenu') {
      DomEvent.preventDefault(e);
    }
    var target = targets[0];
    var data = {
      originalEvent: e
    };
    if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
      var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
      data.containerPoint = isMarker ?
        this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
      data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
      data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
    }
    for (i = 0; i < targets.length; i++) {
      targets[i].fire(type, data, true);
      if (data.originalEvent._stopped ||
        (targets[i].options.bubblingMouseEvents === false && DomUtil.indexOf(this._mouseEvents, type) !== -1)) { return; }
    }
  },
  _draggableMoved: function (obj) {
    obj = obj.dragging && obj.dragging.enabled() ? obj : this;
    return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
  },
  _clearHandlers: function () {
    for (var i = 0, len = this._handlers.length; i < len; i++) {
      this._handlers[i].disable();
    }
  },
  whenReady: function (callback, context) {
    if (this._loaded) {
      callback.call(context || this, {target: this});
    } else {
      this.on('load', callback, context);
    }
    return this;
  },
  _getMapPanePos: function () {
    return DomUtil.getPosition(this._mapPane) || new Point(0, 0);
  },
  _moved: function () {
    var pos = this._getMapPanePos();
    return pos && !pos.equals([0, 0]);
  },
  _getTopLeftPoint: function (center, zoom) {
    var pixelOrigin = center && zoom !== undefined ?
      this._getNewPixelOrigin(center, zoom) :
      this.getPixelOrigin();
    return pixelOrigin.subtract(this._getMapPanePos());
  },
  _getNewPixelOrigin: function (center, zoom) {
    var viewHalf = this.getSize()._divideBy(2);
    return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
  },
  _latLngToNewLayerPoint: function (latlng, zoom, center) {
    var topLeft = this._getNewPixelOrigin(center, zoom);
    return this.project(latlng, zoom)._subtract(topLeft);
  },
  _latLngBoundsToNewLayerBounds: function (latLngBounds, zoom, center) {
    var topLeft = this._getNewPixelOrigin(center, zoom);
    return toBounds([
      this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
      this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
      this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
      this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
    ]);
  },
  _getCenterLayerPoint: function () {
    return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
  },
  _getCenterOffset: function (latlng) {
    return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
  },
  _limitCenter: function (center, zoom, bounds) {
    if (!bounds) { return center; }
    var centerPoint = this.project(center, zoom),
        viewHalf = this.getSize().divideBy(2),
        viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
        offset = this._getBoundsOffset(viewBounds, bounds, zoom);
    if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) {
      return center;
    }
    return this.unproject(centerPoint.add(offset), zoom);
  },
  _limitOffset: function (offset, bounds) {
    if (!bounds) { return offset; }
    var viewBounds = this.getPixelBounds(),
        newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
    return offset.add(this._getBoundsOffset(newBounds, bounds));
  },
  _getBoundsOffset: function (pxBounds, maxBounds, zoom) {
    var projectedMaxBounds = toBounds(
            this.project(maxBounds.getNorthEast(), zoom),
            this.project(maxBounds.getSouthWest(), zoom)
        ),
        minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
        maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),
        dx = this._rebound(minOffset.x, -maxOffset.x),
        dy = this._rebound(minOffset.y, -maxOffset.y);
    return new Point(dx, dy);
  },
  _rebound: function (left, right) {
    return left + right > 0 ?
      Math.round(left - right) / 2 :
      Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
  },
  _limitZoom: function (zoom) {
    var min = this.getMinZoom(),
        max = this.getMaxZoom(),
        snap = Browser.any3d ? this.options.zoomSnap : 1;
    if (snap) {
      zoom = Math.round(zoom / snap) * snap;
    }
    return Math.max(min, Math.min(max, zoom));
  },
  _onPanTransitionStep: function () {
    this.fire('move');
  },
  _onPanTransitionEnd: function () {
    DomUtil.removeClass(this._mapPane, 'atlas-pan-anim');
    this.fire('moveend');
  },
  _tryAnimatedPan: function (center, options) {
    var offset = this._getCenterOffset(center)._trunc();
    if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }
    this.panBy(offset, options);
    return true;
  },
  _createAnimProxy: function () {
    var proxy = this._proxy = create$1_dom('div', 'atlas-proxy atlas-zoom-animated');
    this._panes.mapPane.appendChild(proxy);
    this.on('zoomanim', function (e) {
      var prop = DomUtil.TRANSFORM,
          transform = this._proxy.style[prop];
      DomUtil.setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));
      if (transform === this._proxy.style[prop] && this._animatingZoom) {
        this._onZoomTransitionEnd();
      }
    }, this);
    this.on('load moveend', this._animMoveEnd, this);
    this._on('unload', this._destroyAnimProxy, this);
  },
  _destroyAnimProxy: function () {
    DomUtil.remove(this._proxy);
    this.off('load moveend', this._animMoveEnd, this);
    delete this._proxy;
  },
  _animMoveEnd: function () {
    var c = this.getCenter(),
        z = this.getZoom();
    DomUtil.setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
  },
  _catchTransitionEnd: function (e) {
    if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
      this._onZoomTransitionEnd();
    }
  },
  _nothingToAnimate: function () {
    return !this._container.getElementsByClassName('atlas-zoom-animated').length;
  },
  _tryAnimatedZoom: function (center, zoom, options) {
    if (this._animatingZoom) { return true; }
    options = options || {};
    if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
            Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }
    var scale = this.getZoomScale(zoom),
        offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);
    if (options.animate !== true && !this.getSize().contains(offset)) { return false; }
    DomUtil.requestAnimFrame(function () {
      this
          ._moveStart(true, options.noMoveStart || false)
          ._animateZoom(center, zoom, true);
    }, this);
    return true;
  },
  _animateZoom: function (center, zoom, startAnim, noUpdate) {
    if (!this._mapPane) { return; }
    if (startAnim) {
      this._animatingZoom = true;
      this._animateToCenter = center;
      this._animateToZoom = zoom;
      DomUtil.addClass(this._mapPane, 'atlas-zoom-anim');
    }
    this.fire('zoomanim', {
      center: center,
      zoom: zoom,
      noUpdate: noUpdate
    });
    if (!this._tempFireZoomEvent) {
      this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
    }
    this._move(this._animateToCenter, this._animateToZoom, undefined, true);
    setTimeout(bind(this._onZoomTransitionEnd, this), 250);
  },
  _onZoomTransitionEnd: function () {
    if (!this._animatingZoom) { return; }
    if (this._mapPane) {
      DomUtil.removeClass(this._mapPane, 'atlas-zoom-anim');
    }
    this._animatingZoom = false;
    this._move(this._animateToCenter, this._animateToZoom, undefined, true);
    if (this._tempFireZoomEvent) {
      this.fire('zoom');
    }
    delete this._tempFireZoomEvent;
    this.fire('move');
    this._moveEnd(true);
  }
});

export function createMap(id, options) {
  return new Map(id, options);
}

export var Control = Class.extend({
  options: {
    position: 'topright'
  },
  initialize: function (options) {
    setOptions(this, options);
  },
  getPosition: function () {
    return this.options.position;
  },
  setPosition: function (position) {
    var map = this._map;
    if (map) {
      map.removeControl(this);
    }
    this.options.position = position;
    if (map) {
      map.addControl(this);
    }
    return this;
  },
  getContainer: function () {
    return this._container;
  },
  addTo: function (map) {
    this.remove();
    this._map = map;
    var container = this._container = this.onAdd(map),
        pos = this.getPosition(),
        corner = map._controlCorners[pos];
    DomUtil.addClass(container, 'atlas-control');
    if (pos.indexOf('bottom') !== -1) {
      corner.insertBefore(container, corner.firstChild);
    } else {
      corner.appendChild(container);
    }
    this._map.on('unload', this.remove, this);
    return this;
  },
  remove: function () {
    if (!this._map) {
      return this;
    }
    DomUtil.remove(this._container);
    if (this.onRemove) {
      this.onRemove(this._map);
    }
    this._map.off('unload', this.remove, this);
    this._map = null;
    return this;
  },
  _refocusOnMap: function (e) {
    if (this._map && e && e.screenX > 0 && e.screenY > 0) {
      this._map.getContainer().focus();
    }
  }
});

export var control = function (options) {
  return new Control(options);
};

Map.include({
  addControl: function (control) {
    control.addTo(this);
    return this;
  },
  removeControl: function (control) {
    control.remove();
    return this;
  },
  _initControlPos: function () {
    var corners = this._controlCorners = {},
        l = 'atlas-',
        container = this._controlContainer =
                create$1_dom('div', l + 'control-container', this._container);
    function createCorner(vSide, hSide) {
      var className = l + vSide + ' ' + l + hSide;
      corners[vSide + hSide] = create$1_dom('div', className, container);
    }
    createCorner('top', 'left');
    createCorner('top', 'right');
    createCorner('bottom', 'left');
    createCorner('bottom', 'right');
  },
  _clearControlPos: function () {
    for (var i in this._controlCorners) {
      DomUtil.remove(this._controlCorners[i]);
    }
    DomUtil.remove(this._controlContainer);
    delete this._controlCorners;
    delete this._controlContainer;
  }
});

export var Layers = Control.extend({
  options: {
    collapsed: true,
    position: 'topright',
    autoZIndex: true,
    hideSingleBase: false,
    sortLayers: false,
    sortFunction: function (layerA, layerB, nameA, nameB) {
      return nameA < nameB ? -1 : (nameB < nameA ? 1 : 0);
    }
  },
  initialize: function (baseLayers, overlays, options) {
    setOptions(this, options);
    this._layerControlInputs = [];
    this._layers = [];
    this._lastZIndex = 0;
    this._handlingClick = false;
    this._preventClick = false;
    for (var i in baseLayers) {
      this._addLayer(baseLayers[i], i);
    }
    for (i in overlays) {
      this._addLayer(overlays[i], i, true);
    }
  },
  onAdd: function (map) {
    this._initLayout();
    this._update();
    this._map = map;
    map.on('zoomend', this._checkDisabledLayers, this);
    for (var i = 0; i < this._layers.length; i++) {
      this._layers[i].layer.on('add remove', this._onLayerChange, this);
    }
    return this._container;
  },
  addTo: function (map) {
    Control.prototype.addTo.call(this, map);
    return this._expandIfNotCollapsed();
  },
  onRemove: function () {
    this._map.off('zoomend', this._checkDisabledLayers, this);
    for (var i = 0; i < this._layers.length; i++) {
      this._layers[i].layer.off('add remove', this._onLayerChange, this);
    }
  },
  addBaseLayer: function (layer, name) {
    this._addLayer(layer, name);
    return (this._map) ? this._update() : this;
  },
  addOverlay: function (layer, name) {
    this._addLayer(layer, name, true);
    return (this._map) ? this._update() : this;
  },
  removeLayer: function (layer) {
    layer.off('add remove', this._onLayerChange, this);
    var obj = this._getLayer(stamp(layer));
    if (obj) {
      this._layers.splice(this._layers.indexOf(obj), 1);
    }
    return (this._map) ? this._update() : this;
  },
  expand: function () {
    DomUtil.addClass(this._container, 'atlas-control-layers-expanded');
    this._section.style.height = null;
    var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
    if (acceptableHeight < this._section.clientHeight) {
      DomUtil.addClass(this._section, 'atlas-control-layers-scrollbar');
      this._section.style.height = acceptableHeight + 'px';
    } else {
      DomUtil.removeClass(this._section, 'atlas-control-layers-scrollbar');
    }
    this._checkDisabledLayers();
    return this;
  },
  collapse: function () {
    DomUtil.removeClass(this._container, 'atlas-control-layers-expanded');
    return this;
  },
  _initLayout: function () {
    var className = 'atlas-control-layers',
        container = this._container = create$1_dom('div', className),
        collapsed = this.options.collapsed;
    container.setAttribute('aria-haspopup', true);
    DomEvent.disableClickPropagation(container);
    DomEvent.disableScrollPropagation(container);
    var section = this._section = create$1_dom('section', className + '-list');
    if (collapsed) {
      this._map.on('click', this.collapse, this);
      DomEvent.on(container, {
        mouseenter: this._expandSafely,
        mouseleave: this.collapse
      }, this);
    }
    var link = this._layersLink = create$1_dom('a', className + '-toggle', container);
    link.href = '#';
    link.title = 'Layers';
    link.setAttribute('role', 'button');
    DomEvent.on(link, {
      keydown: function (e) {
        if (e.keyCode === 13) {
          this._expandSafely();
        }
      },
      click: function (e) {
        DomEvent.preventDefault(e);
        this._expandSafely();
      }
    }, this);
    if (!collapsed) {
      this.expand();
    }
    this._baseLayersList = create$1_dom('div', className + '-base', section);
    this._separator = create$1_dom('div', className + '-separator', section);
    this._overlaysList = create$1_dom('div', className + '-overlays', section);
    container.appendChild(section);
  },
  _getLayer: function (id) {
    for (var i = 0; i < this._layers.length; i++) {
      if (this._layers[i] && stamp(this._layers[i].layer) === id) {
        return this._layers[i];
      }
    }
  },
  _addLayer: function (layer, name, overlay) {
    if (this._map) {
      layer.on('add remove', this._onLayerChange, this);
    }
    this._layers.push({
      layer: layer,
      name: name,
      overlay: overlay
    });
    if (this.options.sortLayers) {
      this._layers.sort(bind(function (a, b) {
        return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
      }, this));
    }
    if (this.options.autoZIndex && layer.setZIndex) {
      this._lastZIndex++;
      layer.setZIndex(this._lastZIndex);
    }
    this._expandIfNotCollapsed();
  },
  _update: function () {
    if (!this._container) { return this; }
    DomUtil.empty(this._baseLayersList);
    DomUtil.empty(this._overlaysList);
    this._layerControlInputs = [];
    var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;
    for (i = 0; i < this._layers.length; i++) {
      obj = this._layers[i];
      this._addItem(obj);
      overlaysPresent = overlaysPresent || obj.overlay;
      baseLayersPresent = baseLayersPresent || !obj.overlay;
      baseLayersCount += !obj.overlay ? 1 : 0;
    }
    if (this.options.hideSingleBase) {
      baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
      this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
    }
    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
    return this;
  },
  _onLayerChange: function (e) {
    if (!this._handlingClick) {
      this._update();
    }
    var obj = this._getLayer(stamp(e.target));
    var type = obj.overlay ?
      (e.type === 'add' ? 'overlayadd' : 'overlayremove') :
      (e.type === 'add' ? 'baselayerchange' : null);
    if (type) {
      this._map.fire(type, obj);
    }
  },
  _createRadioElement: function (name, checked) {
    var radioHtml = '<input type="radio" class="atlas-control-layers-selector" name="' +
        name + '"' + (checked ? ' checked="checked"' : '') + '/>';
    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml;
    return radioFragment.firstChild;
  },
  _addItem: function (obj) {
    var label = document.createElement('label'),
        checked = this._map.hasLayer(obj.layer),
        input;
    if (obj.overlay) {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'atlas-control-layers-selector';
      input.defaultChecked = checked;
    } else {
      input = this._createRadioElement('atlas-base-layers_' + stamp(this), checked);
    }
    this._layerControlInputs.push(input);
    input.layerId = stamp(obj.layer);
    DomEvent.on(input, 'click', this._onInputClick, this);
    var name = document.createElement('span');
    name.innerHTML = ' ' + obj.name;
    var holder = document.createElement('span');
    label.appendChild(holder);
    holder.appendChild(input);
    holder.appendChild(name);
    var container = obj.overlay ? this._overlaysList : this._baseLayersList;
    container.appendChild(label);
    this._checkDisabledLayers();
    return label;
  },
  _onInputClick: function () {
    if (this._preventClick) {
      return;
    }
    var inputs = this._layerControlInputs,
        input, layer;
    var addedLayers = [],
        removedLayers = [];
    this._handlingClick = true;
    for (var i = inputs.length - 1; i >= 0; i--) {
      input = inputs[i];
      layer = this._getLayer(input.layerId).layer;
      if (input.checked) {
        addedLayers.push(layer);
      } else if (!input.checked) {
        removedLayers.push(layer);
      }
    }
    for (i = 0; i < removedLayers.length; i++) {
      if (this._map.hasLayer(removedLayers[i])) {
        this._map.removeLayer(removedLayers[i]);
      }
    }
    for (i = 0; i < addedLayers.length; i++) {
      if (!this._map.hasLayer(addedLayers[i])) {
        this._map.addLayer(addedLayers[i]);
      }
    }
    this._handlingClick = false;
    this._refocusOnMap();
  },
  _checkDisabledLayers: function () {
    var inputs = this._layerControlInputs,
        input,
        layer,
        zoom = this._map.getZoom();
    for (var i = inputs.length - 1; i >= 0; i--) {
      input = inputs[i];
      layer = this._getLayer(input.layerId).layer;
      input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
                       (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);
    }
  },
  _expandIfNotCollapsed: function () {
    if (this._map && !this.options.collapsed) {
      this.expand();
    }
    return this;
  },
  _expandSafely: function () {
    var section = this._section;
    this._preventClick = true;
    DomEvent.on(section, 'click', DomEvent.preventDefault);
    this.expand();
    var that = this;
    setTimeout(function () {
      DomEvent.off(section, 'click', DomEvent.preventDefault);
      that._preventClick = false;
    });
  }
});

export var layers = function (baseLayers, overlays, options) {
  return new Layers(baseLayers, overlays, options);
};

export var Zoom = Control.extend({
  options: {
    position: 'topleft',
    zoomInText: '<span aria-hidden="true">+</span>',
    zoomInTitle: 'Zoom in',
    zoomOutText: '<span aria-hidden="true">&#x2212;</span>',
    zoomOutTitle: 'Zoom out'
  },
  onAdd: function (map) {
    var zoomName = 'atlas-control-zoom',
        container = create$1_dom('div', zoomName + ' atlas-bar'),
        options = this.options;
    this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
            zoomName + '-in',  container, this._zoomIn);
    this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
            zoomName + '-out', container, this._zoomOut);
    this._updateDisabled();
    map.on('zoomend zoomlevelschange', this._updateDisabled, this);
    return container;
  },
  onRemove: function (map) {
    map.off('zoomend zoomlevelschange', this._updateDisabled, this);
  },
  disable: function () {
    this._disabled = true;
    this._updateDisabled();
    return this;
  },
  enable: function () {
    this._disabled = false;
    this._updateDisabled();
    return this;
  },
  _zoomIn: function (e) {
    if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
      this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
    }
  },
  _zoomOut: function (e) {
    if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
      this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
    }
  },
  _createButton: function (html, title, className, container, fn) {
    var link = create$1_dom('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);
    DomEvent.disableClickPropagation(link);
    DomEvent.on(link, 'click', DomEvent.stop);
    DomEvent.on(link, 'click', fn, this);
    DomEvent.on(link, 'click', this._refocusOnMap, this);
    return link;
  },
  _updateDisabled: function () {
    var map = this._map,
        className = 'atlas-disabled';
    DomUtil.removeClass(this._zoomInButton, className);
    DomUtil.removeClass(this._zoomOutButton, className);
    this._zoomInButton.setAttribute('aria-disabled', 'false');
    this._zoomOutButton.setAttribute('aria-disabled', 'false');
    if (this._disabled || map._zoom === map.getMinZoom()) {
      DomUtil.addClass(this._zoomOutButton, className);
      this._zoomOutButton.setAttribute('aria-disabled', 'true');
    }
    if (this._disabled || map._zoom === map.getMaxZoom()) {
      DomUtil.addClass(this._zoomInButton, className);
      this._zoomInButton.setAttribute('aria-disabled', 'true');
    }
  }
});

Map.mergeOptions({
  zoomControl: true
});

Map.addInitHook(function () {
  if (this.options.zoomControl) {
    this.zoomControl = new Zoom();
    this.addControl(this.zoomControl);
  }
});

export var zoom = function (options) {
  return new Zoom(options);
};

export var Scale = Control.extend({
  options: {
    position: 'bottomleft',
    maxWidth: 100,
    metric: true,
    imperial: true
  },
  onAdd: function (map) {
    var className = 'atlas-control-scale',
        container = create$1_dom('div', className),
        options = this.options;
    this._addScales(options, className + '-line', container);
    map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    map.whenReady(this._update, this);
    return container;
  },
  onRemove: function (map) {
    map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
  },
  _addScales: function (options, className, container) {
    if (options.metric) {
      this._mScale = create$1_dom('div', className, container);
    }
    if (options.imperial) {
      this._iScale = create$1_dom('div', className, container);
    }
  },
  _update: function () {
    var map = this._map,
        y = map.getSize().y / 2;
    var maxMeters = map.distance(
      map.containerPointToLatLng([0, y]),
      map.containerPointToLatLng([this.options.maxWidth, y]));
    this._updateScales(maxMeters);
  },
  _updateScales: function (maxMeters) {
    if (this.options.metric && maxMeters) {
      this._updateMetric(maxMeters);
    }
    if (this.options.imperial && maxMeters) {
      this._updateImperial(maxMeters);
    }
  },
  _updateMetric: function (maxMeters) {
    var meters = this._getRoundNum(maxMeters),
        label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
    this._updateScale(this._mScale, label, meters / maxMeters);
  },
  _updateImperial: function (maxMeters) {
    var maxFeet = maxMeters * 3.2808399,
        maxMiles, miles, feet;
    if (maxFeet > 5280) {
      maxMiles = maxFeet / 5280;
      miles = this._getRoundNum(maxMiles);
      this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);
    } else {
      feet = this._getRoundNum(maxFeet);
      this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
    }
  },
  _updateScale: function (scale, text, ratio) {
    scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
    scale.innerHTML = text;
  },
  _getRoundNum: function (num) {
    var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
        d = num / pow10;
    d = d >= 10 ? 10 :
        d >= 5 ? 5 :
        d >= 3 ? 3 :
        d >= 2 ? 2 : 1;
    return pow10 * d;
  }
});

export var scale = function (options) {
  return new Scale(options);
};

export var MoroccanFlag = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="atlas-attribution-flag"><rect width="12" height="8" fill="#c1272d"/><path d="M6 2l1.176 3.608H3.824L5 3.392 6 2z" fill="#006233"/></svg>';
export var Attribution = Control.extend({
  options: {
    position: 'bottomright',
    prefix: '<a href="https://atlasjs.com" title="A JavaScript library for interactive maps">' + (Browser.inlineSvg ? MoroccanFlag + ' ' : '') + 'Atlas</a>'
  },
  initialize: function (options) {
    setOptions(this, options);
    this._attributions = {};
  },
  onAdd: function (map) {
    map.attributionControl = this;
    this._container = create$1_dom('div', 'atlas-control-attribution');
    DomEvent.disableClickPropagation(this._container);
    for (var i in map._layers) {
      if (map._layers[i].getAttribution) {
        this.addAttribution(map._layers[i].getAttribution());
      }
    }
    this._update();
    map.on('layeradd', this._addAttribution, this);
    return this._container;
  },
  onRemove: function (map) {
    map.off('layeradd', this._addAttribution, this);
  },
  _addAttribution: function (ev) {
    if (ev.layer.getAttribution) {
      this.addAttribution(ev.layer.getAttribution());
      ev.layer.once('remove', function () {
        this.removeAttribution(ev.layer.getAttribution());
      }, this);
    }
  },
  setPrefix: function (prefix) {
    this.options.prefix = prefix;
    this._update();
    return this;
  },
  addAttribution: function (text) {
    if (!text) { return this; }
    if (!this._attributions[text]) {
      this._attributions[text] = 0;
    }
    this._attributions[text]++;
    this._update();
    return this;
  },
  removeAttribution: function (text) {
    if (!text) { return this; }
    if (this._attributions[text]) {
      this._attributions[text]--;
      this._update();
    }
    return this;
  },
  _update: function () {
    if (!this._map) { return; }
    var attribs = [];
    for (var i in this._attributions) {
      if (this._attributions[i]) {
        attribs.push(i);
      }
    }
    var prefixAndAttribs = [];
    if (this.options.prefix) {
      prefixAndAttribs.push(this.options.prefix);
    }
    if (attribs.length) {
      prefixAndAttribs.push(attribs.join(', '));
    }
    this._container.innerHTML = prefixAndAttribs.join(' <span aria-hidden="true">|</span> ');
  }
});

Map.mergeOptions({
  attributionControl: true
});

Map.addInitHook(function () {
  if (this.options.attributionControl) {
    new Attribution().addTo(this);
  }
});

export var attribution = function (options) {
  return new Attribution(options);
};

Control.Layers = Layers;
Control.Zoom = Zoom;
Control.Scale = Scale;
Control.Attribution = Attribution;
control.layers = layers;
control.zoom = zoom;
control.scale = scale;
control.attribution = attribution;