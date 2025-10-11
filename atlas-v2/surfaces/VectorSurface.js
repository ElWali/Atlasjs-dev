import Surface from './Surface.js';

class VectorSurface extends Surface {
  constructor(engine, features = []) {
    super(engine);
    this.features = features;

    // Watch for changes in the viewport to trigger re-renders
    this.engine.stateManager.watch('viewport.center', () => this.engine.renderPipeline.render());
    this.engine.stateManager.watch('viewport.zoom', () => this.engine.renderPipeline.render());
  }

  addFeature(feature) {
    this.features.push(feature);
    this.engine.renderPipeline.render();
  }

  removeFeature(feature) {
    const index = this.features.indexOf(feature);
    if (index > -1) {
      this.features.splice(index, 1);
      this.engine.renderPipeline.render();
    }
  }

  render(renderer) {
    for (const feature of this.features) {
      this.engine.renderPipeline.draw(renderer, feature);
    }
  }
}

export default VectorSurface;