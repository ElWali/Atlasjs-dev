const engine = new atlas.AtlasEngine('map', {
  center: new atlas.GeoPoint(32.9, -7.2),
  zoom: 7,
});

const tileSurface = new atlas.TileSurface(engine, {
  urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
engine.surfaces.mount(tileSurface);

const vectorSurface = new atlas.VectorSurface(engine);
engine.surfaces.mount(vectorSurface);

const casablanca = new atlas.Feature(new atlas.GeoPoint(33.5731, -7.5898), { name: 'Casablanca' });
const rabat = new atlas.Feature(new atlas.GeoPoint(34.0209, -6.8416), { name: 'Rabat' });
const marrakesh = new atlas.Feature(new atlas.GeoPoint(31.6295, -7.9811), { name: 'Marrakesh' });

const line = new atlas.Feature(
  new atlas.GeoLine([casablanca.geometry, rabat.geometry, marrakesh.geometry]),
  {},
  { color: 'red', weight: 5 }
);

const polygon = new atlas.Feature(
  new atlas.GeoPolygon([casablanca.geometry, rabat.geometry, marrakesh.geometry]),
  {},
  { color: 'green', fillColor: 'rgba(0, 255, 0, 0.5)' }
);

vectorSurface.addFeature(casablanca);
vectorSurface.addFeature(rabat);
vectorSurface.addFeature(marrakesh);
vectorSurface.addFeature(line);
vectorSurface.addFeature(polygon);