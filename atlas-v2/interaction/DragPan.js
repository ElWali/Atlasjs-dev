import Behavior from './Behavior.js';

class DragPan extends Behavior {
  constructor(engine) {
    super(engine);
    this._isDragging = false;
    this._lastPos = null;
  }

  addHooks() {
    this.engine.container.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.engine.container.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.engine.container.addEventListener('mousemove', this._onMouseMove.bind(this));
  }

  removeHooks() {
    this.engine.container.removeEventListener('mousedown', this._onMouseDown.bind(this));
    this.engine.container.removeEventListener('mouseup', this._onMouseUp.bind(this));
    this.engine.container.removeEventListener('mousemove', this._onMouseMove.bind(this));
  }

  _onMouseDown(e) {
    if (e.button !== 0) { return; } // Only handle left-clicks
    this._isDragging = true;
    this._lastPos = { x: e.clientX, y: e.clientY };
    this.engine.container.style.cursor = 'grabbing';
  }

  _onMouseUp() {
    this._isDragging = false;
    this.engine.container.style.cursor = 'grab';
  }

  _onMouseMove(e) {
    if (!this._isDragging) { return; }

    const pos = { x: e.clientX, y: e.clientY };
    const offset = {
      x: this._lastPos.x - pos.x,
      y: this._lastPos.y - pos.y
    };

    this.engine.viewport.panBy(offset);
    this._lastPos = pos;
  }
}

export default DragPan;