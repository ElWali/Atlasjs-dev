import Behavior from './Behavior.js';

class ScrollWheelZoom extends Behavior {
  addHooks() {
    this.engine.container.addEventListener('wheel', this._onWheel.bind(this));
  }

  removeHooks() {
    this.engine.container.removeEventListener('wheel', this._onWheel.bind(this));
  }

  _onWheel(e) {
    e.preventDefault();

    const delta = e.deltaY;
    if (delta > 0) {
      this.engine.viewport.zoomOut();
    } else if (delta < 0) {
      this.engine.viewport.zoomIn();
    }
  }
}

export default ScrollWheelZoom;