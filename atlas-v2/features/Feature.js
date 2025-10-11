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

export default Feature;