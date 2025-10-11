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

export default SurfaceManager;