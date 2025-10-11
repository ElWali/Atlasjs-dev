import { formatNum, isArray } from '../utils.js';
import { toArea } from './Area.js';

const R = 6371000; // Earth radius in meters

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
    return R * c;
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

export function toGeoPoint(a, b, c) {
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

export default GeoPoint;