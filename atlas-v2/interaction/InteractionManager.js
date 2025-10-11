class InteractionManager {
  constructor(engine) {
    this.engine = engine;
    this._behaviors = {};
    this._events = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
      'mousemove', 'contextmenu', 'wheel'
    ];
  }

  add(behavior, name) {
    this._behaviors[name] = behavior;
    // By default, behaviors are not enabled until explicitly told to do so.
  }

  enable(name) {
    const behavior = this._behaviors[name];
    if (behavior) {
      behavior.enable();
    }
  }

  disable(name) {
    const behavior = this._behaviors[name];
    if (behavior) {
      behavior.disable();
    }
  }

  _initEvents() {
    const container = this.engine.container;
    for (const event of this._events) {
      container.addEventListener(event, this._handleEvent.bind(this));
    }
  }

  _handleEvent(e) {
    // This is a simplified event delegation model.
    // A more robust implementation might involve a priority system for behaviors.
    for (const name in this._behaviors) {
      const behavior = this._behaviors[name];
      if (behavior.enabled()) {
        // Pass the event to the behavior's event handler, if it exists.
        const handler = behavior[e.type];
        if (handler && typeof handler === 'function') {
          handler.call(behavior, e);
        }
      }
    }
  }
}

export default InteractionManager;