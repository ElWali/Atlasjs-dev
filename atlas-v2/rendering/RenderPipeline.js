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
}

export default RenderPipeline;