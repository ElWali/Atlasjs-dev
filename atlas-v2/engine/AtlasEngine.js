import StateManager from '../state/StateManager.js';
import CommandBus from '../commands/CommandBus.js';
import ViewportManager from '../viewport/ViewportManager.js';
import SurfaceManager from '../surfaces/SurfaceManager.js';
import RenderPipeline from '../rendering/RenderPipeline.js';
import EPSG3857 from '../projection/EPSG3857.js';

class AtlasEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found.`);
    }

    // Initialize core components
    this.stateManager = new StateManager();
    this.commandBus = new CommandBus();
    this.projection = options.projection || new EPSG3857();
    this.viewport = new ViewportManager(this);
    this.surfaces = new SurfaceManager(this);
    this.renderPipeline = new RenderPipeline(this);

    // ... more initialization to come
  }
}

export default AtlasEngine;