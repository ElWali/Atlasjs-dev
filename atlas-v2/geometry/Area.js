import GeoPoint, { toGeoPoint } from './GeoPoint.js';

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

export function toArea(a, b) {
  if (a instanceof Area) {
    return a;
  }
  return new Area(a, b);
}

export default Area;