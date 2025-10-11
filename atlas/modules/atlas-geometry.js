import { formatNum, isArray, wrapNum } from './atlas-utils.js';
import { Earth } from './atlas-core.js';

export function Point(x, y, round) {
  this.x = (round ? Math.round(x) : x);
  this.y = (round ? Math.round(y) : y);
}

var trunc = Math.trunc || function (v) {
  return v > 0 ? Math.floor(v) : Math.ceil(v);
};

Point.prototype = {
  clone: function () {
    return new Point(this.x, this.y);
  },
  add: function (point) {
    return this.clone()._add(toPoint(point));
  },
  _add: function (point) {
    this.x += point.x;
    this.y += point.y;
    return this;
  },
  subtract: function (point) {
    return this.clone()._subtract(toPoint(point));
  },
  _subtract: function (point) {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  },
  divideBy: function (num) {
    return this.clone()._divideBy(num);
  },
  _divideBy: function (num) {
    this.x /= num;
    this.y /= num;
    return this;
  },
  multiplyBy: function (num) {
    return this.clone()._multiplyBy(num);
  },
  _multiplyBy: function (num) {
    this.x *= num;
    this.y *= num;
    return this;
  },
  scaleBy: function (point) {
    return new Point(this.x * point.x, this.y * point.y);
  },
  unscaleBy: function (point) {
    return new Point(this.x / point.x, this.y / point.y);
  },
  round: function () {
    return this.clone()._round();
  },
  _round: function () {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  },
  floor: function () {
    return this.clone()._floor();
  },
  _floor: function () {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  },
  ceil: function () {
    return this.clone()._ceil();
  },
  _ceil: function () {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  },
  trunc: function () {
    return this.clone()._trunc();
  },
  _trunc: function () {
    this.x = trunc(this.x);
    this.y = trunc(this.y);
    return this;
  },
  distanceTo: function (point) {
    point = toPoint(point);
    var x = point.x - this.x,
        y = point.y - this.y;
    return Math.sqrt(x * x + y * y);
  },
  equals: function (point) {
    point = toPoint(point);
    return point.x === this.x &&
           point.y === this.y;
  },
  contains: function (point) {
    point = toPoint(point);
    return Math.abs(point.x) <= Math.abs(this.x) &&
           Math.abs(point.y) <= Math.abs(this.y);
  },
  toString: function () {
    return 'Point(' +
            formatNum(this.x) + ', ' +
            formatNum(this.y) + ')';
  }
};

export function toPoint(x, y, round) {
  if (x instanceof Point) {
    return x;
  }
  if (isArray(x)) {
    return new Point(x[0], x[1]);
  }
  if (x === undefined || x === null) {
    return x;
  }
  if (typeof x === 'object' && 'x' in x && 'y' in x) {
    return new Point(x.x, x.y);
  }
  return new Point(x, y, round);
}

export function Bounds(a, b) {
  if (!a) { return; }
  var points = b ? [a, b] : a;
  for (var i = 0, len = points.length; i < len; i++) {
    this.extend(points[i]);
  }
}

Bounds.prototype = {
  extend: function (obj) {
    var min2, max2;
    if (!obj) { return this; }
    if (obj instanceof Point || typeof obj[0] === 'number' || 'x' in obj) {
      min2 = max2 = toPoint(obj);
    } else {
      obj = toBounds(obj);
      min2 = obj.min;
      max2 = obj.max;
      if (!min2 || !max2) { return this; }
    }
    if (!this.min && !this.max) {
      this.min = min2.clone();
      this.max = max2.clone();
    } else {
      this.min.x = Math.min(min2.x, this.min.x);
      this.max.x = Math.max(max2.x, this.max.x);
      this.min.y = Math.min(min2.y, this.min.y);
      this.max.y = Math.max(max2.y, this.max.y);
    }
    return this;
  },
  getCenter: function (round) {
    return toPoint(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2, round);
  },
  getBottomLeft: function () {
    return toPoint(this.min.x, this.max.y);
  },
  getTopRight: function () {
    return toPoint(this.max.x, this.min.y);
  },
  getTopLeft: function () {
    return this.min;
  },
  getBottomRight: function () {
    return this.max;
  },
  getSize: function () {
    return this.max.subtract(this.min);
  },
  contains: function (obj) {
    var min, max;
    if (typeof obj[0] === 'number' || obj instanceof Point) {
      obj = toPoint(obj);
    } else {
      obj = toBounds(obj);
    }
    if (obj instanceof Bounds) {
      min = obj.min;
      max = obj.max;
    } else {
      min = max = obj;
    }
    return (min.x >= this.min.x) &&
           (max.x <= this.max.x) &&
           (min.y >= this.min.y) &&
           (max.y <= this.max.y);
  },
  intersects: function (bounds) {
    bounds = toBounds(bounds);
    var min = this.min,
        max = this.max,
        min2 = bounds.min,
        max2 = bounds.max,
        xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
        yIntersects = (max2.y >= min.y) && (min2.y <= max.y);
    return xIntersects && yIntersects;
  },
  overlaps: function (bounds) {
    bounds = toBounds(bounds);
    var min = this.min,
        max = this.max,
        min2 = bounds.min,
        max2 = bounds.max,
        xOverlaps = (max2.x > min.x) && (min2.x < max.x),
        yOverlaps = (max2.y > min.y) && (min2.y < max.y);
    return xOverlaps && yOverlaps;
  },
  isValid: function () {
    return !!(this.min && this.max);
  },
  pad: function (bufferRatio) {
    var min = this.min,
    max = this.max,
    heightBuffer = Math.abs(min.x - max.x) * bufferRatio,
    widthBuffer = Math.abs(min.y - max.y) * bufferRatio;
    return toBounds(
      toPoint(min.x - heightBuffer, min.y - widthBuffer),
      toPoint(max.x + heightBuffer, max.y + widthBuffer));
  },
  equals: function (bounds) {
    if (!bounds) { return false; }
    bounds = toBounds(bounds);
    return this.min.equals(bounds.getTopLeft()) &&
      this.max.equals(bounds.getBottomRight());
  },
};

export function toBounds(a, b) {
  if (!a || a instanceof Bounds) {
    return a;
  }
  return new Bounds(a, b);
}

export function LatLngBounds(corner1, corner2) {
  if (!corner1) { return; }
  var latlngs = corner2 ? [corner1, corner2] : corner1;
  for (var i = 0, len = latlngs.length; i < len; i++) {
    this.extend(latlngs[i]);
  }
}

LatLngBounds.prototype = {
  extend: function (obj) {
    var sw = this._southWest,
        ne = this._northEast,
        sw2, ne2;
    if (obj instanceof LatLng) {
      sw2 = obj;
      ne2 = obj;
    } else if (obj instanceof LatLngBounds) {
      sw2 = obj._southWest;
      ne2 = obj._northEast;
      if (!sw2 || !ne2) { return this; }
    } else {
      return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
    }
    if (!sw && !ne) {
      this._southWest = new LatLng(sw2.lat, sw2.lng);
      this._northEast = new LatLng(ne2.lat, ne2.lng);
    } else {
      sw.lat = Math.min(sw2.lat, sw.lat);
      sw.lng = Math.min(sw2.lng, sw.lng);
      ne.lat = Math.max(ne2.lat, ne.lat);
      ne.lng = Math.max(ne2.lng, ne.lng);
    }
    return this;
  },
  pad: function (bufferRatio) {
    var sw = this._southWest,
        ne = this._northEast,
        heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
        widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
    return new LatLngBounds(
            new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
            new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
  },
  getCenter: function () {
    return new LatLng(
            (this._southWest.lat + this._northEast.lat) / 2,
            (this._southWest.lng + this._northEast.lng) / 2);
  },
  getSouthWest: function () {
    return this._southWest;
  },
  getNorthEast: function () {
    return this._northEast;
  },
  getNorthWest: function () {
    return new LatLng(this.getNorth(), this.getWest());
  },
  getSouthEast: function () {
    return new LatLng(this.getSouth(), this.getEast());
  },
  getWest: function () {
    return this._southWest.lng;
  },
  getSouth: function () {
    return this._southWest.lat;
  },
  getEast: function () {
    return this._northEast.lng;
  },
  getNorth: function () {
    return this._northEast.lat;
  },
  contains: function (obj) {
    if (typeof obj[0] === 'number' || obj instanceof LatLng || 'lat' in obj) {
      obj = toLatLng(obj);
    } else {
      obj = toLatLngBounds(obj);
    }
    var sw = this._southWest,
        ne = this._northEast,
        sw2, ne2;
    if (obj instanceof LatLngBounds) {
      sw2 = obj.getSouthWest();
      ne2 = obj.getNorthEast();
    } else {
      sw2 = ne2 = obj;
    }
    return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
           (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
  },
  intersects: function (bounds) {
    bounds = toLatLngBounds(bounds);
    var sw = this._southWest,
        ne = this._northEast,
        sw2 = bounds.getSouthWest(),
        ne2 = bounds.getNorthEast(),
        latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
        lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);
    return latIntersects && lngIntersects;
  },
  overlaps: function (bounds) {
    bounds = toLatLngBounds(bounds);
    var sw = this._southWest,
        ne = this._northEast,
        sw2 = bounds.getSouthWest(),
        ne2 = bounds.getNorthEast(),
        latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
        lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);
    return latOverlaps && lngOverlaps;
  },
  toBBoxString: function () {
    return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
  },
  equals: function (bounds, maxMargin) {
    if (!bounds) { return false; }
    bounds = toLatLngBounds(bounds);
    return this._southWest.equals(bounds.getSouthWest(), maxMargin) &&
           this._northEast.equals(bounds.getNorthEast(), maxMargin);
  },
  isValid: function () {
    return !!(this._southWest && this._northEast);
  }
};

export function toLatLngBounds(a, b) {
  if (a instanceof LatLngBounds) {
    return a;
  }
  return new LatLngBounds(a, b);
}

export function LatLng(lat, lng, alt) {
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
  }
  this.lat = +lat;
  this.lng = +lng;
  if (alt !== undefined) {
    this.alt = +alt;
  }
}

LatLng.prototype = {
  equals: function (obj, maxMargin) {
    if (!obj) { return false; }
    obj = toLatLng(obj);
    var margin = Math.max(
            Math.abs(this.lat - obj.lat),
            Math.abs(this.lng - obj.lng));
    return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
  },
  toString: function (precision) {
    return 'LatLng(' +
            formatNum(this.lat, precision) + ', ' +
            formatNum(this.lng, precision) + ')';
  },
  distanceTo: function (other) {
    return Earth.distance(this, toLatLng(other));
  },
  wrap: function () {
    return Earth.wrapLatLng(this);
  },
  toBounds: function (sizeInMeters) {
    var latAccuracy = 180 * sizeInMeters / 40075017,
        lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);
    return toLatLngBounds(
            [this.lat - latAccuracy, this.lng - lngAccuracy],
            [this.lat + latAccuracy, this.lng + lngAccuracy]);
  },
  clone: function () {
    return new LatLng(this.lat, this.lng, this.alt);
  }
};

export function toLatLng(a, b, c) {
  if (a instanceof LatLng) {
    return a;
  }
  if (isArray(a) && typeof a[0] !== 'object') {
    if (a.length === 3) {
      return new LatLng(a[0], a[1], a[2]);
    }
    if (a.length === 2) {
      return new LatLng(a[0], a[1]);
    }
    return null;
  }
  if (a === undefined || a === null) {
    return a;
  }
  if (typeof a === 'object' && 'lat' in a) {
    return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
  }
  if (b === undefined) {
    return null;
  }
  return new LatLng(a, b, c);
}

function clipPolygon(points, bounds, round) {
  var clippedPoints,
      edges = [1, 4, 2, 8],
      i, j, k,
      a, b,
      len, edge, p;
  for (i = 0, len = points.length; i < len; i++) {
    points[i]._code = _getBitCode(points[i], bounds);
  }
  for (k = 0; k < 4; k++) {
    edge = edges[k];
    clippedPoints = [];
    for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
      a = points[i];
      b = points[j];
      if (!(a._code & edge)) {
        if (b._code & edge) {
          p = _getEdgeIntersection(b, a, edge, bounds, round);
          p._code = _getBitCode(p, bounds);
          clippedPoints.push(p);
        }
        clippedPoints.push(a);
      } else if (!(b._code & edge)) {
        p = _getEdgeIntersection(b, a, edge, bounds, round);
        p._code = _getBitCode(p, bounds);
        clippedPoints.push(p);
      }
    }
    points = clippedPoints;
  }
  return points;
}

function polygonCenter(latlngs, crs) {
  var i, j, p1, p2, f, area, x, y, center;
  if (!latlngs || latlngs.length === 0) {
    throw new Error('latlngs not passed');
  }
  if (!isFlat(latlngs)) {
    console.warn('latlngs are not flat! Only the first ring will be used');
    latlngs = latlngs[0];
  }
  var centroidLatLng = toLatLng([0, 0]);
  var bounds = toLatLngBounds(latlngs);
  var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
  if (areaBounds < 1700) {
    centroidLatLng = centroid(latlngs);
  }
  var len = latlngs.length;
  var points = [];
  for (i = 0; i < len; i++) {
    var latlng = toLatLng(latlngs[i]);
    points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
  }
  area = x = y = 0;
  for (i = 0, j = len - 1; i < len; j = i++) {
    p1 = points[i];
    p2 = points[j];
    f = p1.y * p2.x - p2.y * p1.x;
    x += (p1.x + p2.x) * f;
    y += (p1.y + p2.y) * f;
    area += f * 3;
  }
  if (area === 0) {
    center = points[0];
  } else {
    center = [x / area, y / area];
  }
  var latlngCenter = crs.unproject(toPoint(center));
  return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
}

function centroid(coords) {
  var latSum = 0;
  var lngSum = 0;
  var len = 0;
  for (var i = 0; i < coords.length; i++) {
    var latlng = toLatLng(coords[i]);
    latSum += latlng.lat;
    lngSum += latlng.lng;
    len++;
  }
  return toLatLng([latSum / len, lngSum / len]);
}

export var PolyUtil = {
  clipPolygon: clipPolygon,
  polygonCenter: polygonCenter,
  centroid: centroid
};

export function simplify(points, tolerance) {
  if (!tolerance || !points.length) {
    return points.slice();
  }
  var sqTolerance = tolerance * tolerance;
      points = _reducePoints(points, sqTolerance);
      points = _simplifyDP(points, sqTolerance);
  return points;
}

export function pointToSegmentDistance(p, p1, p2) {
  return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
}

export function closestPointOnSegment(p, p1, p2) {
  return _sqClosestPointOnSegment(p, p1, p2);
}

function _simplifyDP(points, sqTolerance) {
  var len = points.length,
      ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
      markers = new ArrayConstructor(len);
      markers[0] = markers[len - 1] = 1;
  _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
  var i,
      newPoints = [];
  for (i = 0; i < len; i++) {
    if (markers[i]) {
      newPoints.push(points[i]);
    }
  }
  return newPoints;
}

function _simplifyDPStep(points, markers, sqTolerance, first, last) {
  var maxSqDist = 0,
  index, i, sqDist;
  for (i = first + 1; i <= last - 1; i++) {
    sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }
  if (maxSqDist > sqTolerance) {
    markers[index] = 1;
    _simplifyDPStep(points, markers, sqTolerance, first, index);
    _simplifyDPStep(points, markers, sqTolerance, index, last);
  }
}

function _reducePoints(points, sqTolerance) {
  var reducedPoints = [points[0]];
  for (var i = 1, prev = 0, len = points.length; i < len; i++) {
    if (_sqDist(points[i], points[prev]) > sqTolerance) {
      reducedPoints.push(points[i]);
      prev = i;
    }
  }
  if (prev < len - 1) {
    reducedPoints.push(points[len - 1]);
  }
  return reducedPoints;
}

var _lastCode;
export function clipSegment(a, b, bounds, useLastCode, round) {
  var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
      codeB = _getBitCode(b, bounds),
      codeOut, p, newCode;
      _lastCode = codeB;
  while (true) {
    if (!(codeA | codeB)) {
      return [a, b];
    }
    if (codeA & codeB) {
      return false;
    }
    codeOut = codeA || codeB;
    p = _getEdgeIntersection(a, b, codeOut, bounds, round);
    newCode = _getBitCode(p, bounds);
    if (codeOut === codeA) {
      a = p;
      codeA = newCode;
    } else {
      b = p;
      codeB = newCode;
    }
  }
}

export function _getEdgeIntersection(a, b, code, bounds, round) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      min = bounds.min,
      max = bounds.max,
      x, y;
  if (code & 8) {
    x = a.x + dx * (max.y - a.y) / dy;
    y = max.y;
  } else if (code & 4) {
    x = a.x + dx * (min.y - a.y) / dy;
    y = min.y;
  } else if (code & 2) {
    x = max.x;
    y = a.y + dy * (max.x - a.x) / dx;
  } else if (code & 1) {
    x = min.x;
    y = a.y + dy * (min.x - a.x) / dx;
  }
  return new Point(x, y, round);
}

export function _getBitCode(p, bounds) {
  var code = 0;
  if (p.x < bounds.min.x) {
    code |= 1;
  } else if (p.x > bounds.max.x) {
    code |= 2;
  }
  if (p.y < bounds.min.y) {
    code |= 4;
  } else if (p.y > bounds.max.y) {
    code |= 8;
  }
  return code;
}

function _sqDist(p1, p2) {
  var dx = p2.x - p1.x,
      dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
  var x = p1.x,
      y = p1.y,
      dx = p2.x - x,
      dy = p2.y - y,
      dot = dx * dx + dy * dy,
      t;
  if (dot > 0) {
    t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p.x - x;
  dy = p.y - y;
  return sqDist ? dx * dx + dy * dy : new Point(x, y);
}

export function isFlat(latlngs) {
  return !isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
}

export function _flat(latlngs) {
  console.warn('Deprecated use of _flat, please use atlas.LineUtil.isFlat instead.');
  return isFlat(latlngs);
}

function polylineCenter(latlngs, crs) {
  var i, halfDist, segDist, dist, p1, p2, ratio, center;
  if (!latlngs || latlngs.length === 0) {
    throw new Error('latlngs not passed');
  }
  if (!isFlat(latlngs)) {
    console.warn('latlngs are not flat! Only the first ring will be used');
    latlngs = latlngs[0];
  }
  var centroidLatLng = toLatLng([0, 0]);
  var bounds = toLatLngBounds(latlngs);
  var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
  if (areaBounds < 1700) {
    centroidLatLng = centroid(latlngs);
  }
  var len = latlngs.length;
  var points = [];
  for (i = 0; i < len; i++) {
    var latlng = toLatLng(latlngs[i]);
    points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
  }
  for (i = 0, halfDist = 0; i < len - 1; i++) {
    halfDist += points[i].distanceTo(points[i + 1]) / 2;
  }
  if (halfDist === 0) {
    center = points[0];
  } else {
    for (i = 0, dist = 0; i < len - 1; i++) {
      p1 = points[i];
      p2 = points[i + 1];
      segDist = p1.distanceTo(p2);
      dist += segDist;
      if (dist > halfDist) {
        ratio = (dist - halfDist) / segDist;
        center = [
          p2.x - ratio * (p2.x - p1.x),
          p2.y - ratio * (p2.y - p1.y)
        ];
        break;
      }
    }
  }
  var latlngCenter = crs.unproject(toPoint(center));
  return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
}

export var LineUtil = {
  simplify: simplify,
  pointToSegmentDistance: pointToSegmentDistance,
  closestPointOnSegment: closestPointOnSegment,
  clipSegment: clipSegment,
  _getEdgeIntersection: _getEdgeIntersection,
  _getBitCode: _getBitCode,
  _sqClosestPointOnSegment: _sqClosestPointOnSegment,
  isFlat: isFlat,
  _flat: _flat,
  polylineCenter: polylineCenter
};