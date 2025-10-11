import Widget from './Widget.js';

class ZoomWidget extends Widget {
  constructor(engine, options) {
    super(engine, {
      position: 'topleft',
      zoomInText: '+',
      zoomInTitle: 'Zoom in',
      zoomOutText: '−',
      zoomOutTitle: 'Zoom out',
      ...options
    });
  }

  onAdd(engine) {
    const container = document.createElement('div');
    container.className = 'atlas-zoom-widget atlas-bar';

    this._zoomInButton = this._createButton(this.options.zoomInText, this.options.zoomInTitle, 'atlas-zoom-in', container, () => this.engine.viewport.zoomIn());
    this._zoomOutButton = this._createButton(this.options.zoomOutText, this.options.zoomOutTitle, 'atlas-zoom-out', container, () => this.engine.viewport.zoomOut());

    this.engine.stateManager.watch('viewport.zoom', () => this._updateDisabled());
    this._updateDisabled();

    return container;
  }

  _createButton(html, title, className, container, fn) {
    const link = document.createElement('a');
    link.innerHTML = html;
    link.href = '#';
    link.title = title;
    link.className = className;
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });

    container.appendChild(link);
    return link;
  }

  _updateDisabled() {
    const zoom = this.engine.stateManager.get('viewport.zoom');
    const minZoom = this.engine.stateManager.get('viewport.minZoom') || 0;
    const maxZoom = this.engine.stateManager.get('viewport.maxZoom') || 18;

    this._zoomInButton.classList.remove('atlas-disabled');
    this._zoomOutButton.classList.remove('atlas-disabled');

    if (zoom <= minZoom) {
      this._zoomOutButton.classList.add('atlas-disabled');
    }
    if (zoom >= maxZoom) {
      this._zoomInButton.classList.add('atlas-disabled');
    }
  }
}

export default ZoomWidget;