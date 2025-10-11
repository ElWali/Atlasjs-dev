import Surface from './Surface.js';

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

    const center = this.engine.stateManager.get('viewport.center');
    const projection = this.engine.projection;
    const scale = projection.scale(zoom);
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

export default TileSurface;