class WidgetSystem {
  constructor(engine) {
    this.engine = engine;
    this._widgets = [];
    this._corners = {};
    this._initLayout();
  }

  add(widget) {
    this._widgets.push(widget);
    widget._container = widget.onAdd(this.engine);

    const pos = widget.options.position || 'topright';
    const corner = this._corners[pos];

    if (corner) {
      if (pos.includes('bottom')) {
        corner.insertBefore(widget.getContainer(), corner.firstChild);
      } else {
        corner.appendChild(widget.getContainer());
      }
    }
    return this;
  }

  remove(widget) {
    const index = this._widgets.indexOf(widget);
    if (index > -1) {
      this._widgets.splice(index, 1);

      const container = widget.getContainer();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }

      if (widget.onRemove) {
        widget.onRemove(this.engine);
      }
    }
    return this;
  }

  _initLayout() {
    const container = this.engine.container;

    this._controlContainer = document.createElement('div');
    this._controlContainer.className = 'atlas-widget-container';
    container.appendChild(this._controlContainer);

    this._createCorner('top', 'left');
    this._createCorner('top', 'right');
    this._createCorner('bottom', 'left');
    this._createCorner('bottom', 'right');
  }

  _createCorner(vSide, hSide) {
    const className = `atlas-widget-${vSide} atlas-widget-${hSide}`;
    const corner = document.createElement('div');
    corner.className = className;
    this._corners[vSide + hSide] = corner;
    this._controlContainer.appendChild(corner);
  }
}

export default WidgetSystem;