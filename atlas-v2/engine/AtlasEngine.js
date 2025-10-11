import StateManager from '../state/StateManager.js';
import CommandBus from '../commands/CommandBus.js';
import ViewportManager from '../viewport/ViewportManager.js';
import SurfaceManager from '../surfaces/SurfaceManager.js';
import RenderPipeline from '../rendering/RenderPipeline.js';
import EPSG3857 from '../projection/EPSG3857.js';
import InteractionManager from '../interaction/InteractionManager.js';
import DragPan from '../interaction/DragPan.js';
import ScrollWheelZoom from '../interaction/ScrollWheelZoom.js';
import WidgetSystem from '../widgets/WidgetSystem.js';
import ZoomWidget from '../widgets/ZoomWidget.js';

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
    this.viewport = new ViewportManager(this, options);
    this.surfaces = new SurfaceManager(this);
    this.renderPipeline = new RenderPipeline(this);
    this.widgets = new WidgetSystem(this);
    this.interaction = new InteractionManager(this);

    // Add default widgets and behaviors
    this.widgets.add(new ZoomWidget(this));
    this.interaction.add(new DragPan(this), 'dragPan');
    this.interaction.add(new ScrollWheelZoom(this), 'scrollWheelZoom');

    // Enable default behaviors
    this.interaction.enable('dragPan');
    this.interaction.enable('scrollWheelZoom');

    this.interaction._initEvents();
  }
}

export default AtlasEngine;