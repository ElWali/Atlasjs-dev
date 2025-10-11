/**
 * The base class for all UI components (widgets) in Atlas.js.
 * It provides a standard interface for widgets to be added to and removed from the map.
 */
class Widget {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.options = { ...options };
    this._container = null;
  }

  /**
   * Called when the widget is added to the map by the WidgetSystem.
   * This method must be implemented by subclasses and should return the widget's DOM container.
   * @param {AtlasEngine} engine - The main engine instance.
   * @returns {HTMLElement} The widget's container element.
   */
  onAdd(engine) {
    throw new Error('The onAdd() method must be implemented by subclasses.');
  }

  /**
   * Called when the widget is removed from the map.
   * Subclasses can implement this method to perform any necessary cleanup.
   * @param {AtlasEngine} engine - The main engine instance.
   */
  onRemove(engine) {
    // Optional: To be implemented by subclasses for cleanup logic.
  }

  /**
   * Returns the widget's main DOM container.
   * @returns {HTMLElement} The container element.
   */
  getContainer() {
    return this._container;
  }
}

export default Widget;