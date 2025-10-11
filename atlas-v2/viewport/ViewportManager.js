class ViewportManager {
  constructor(engine) {
    this.engine = engine;
    this.stateManager = engine.stateManager;

    // Initialize viewport state
    this.stateManager.set('viewport.center', [0, 0]);
    this.stateManager.set('viewport.zoom', 1);
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
    // Logic to pan the map by a certain pixel offset will go here.
    console.log(`Panning by: ${offset}`);
  }
}

export default ViewportManager;