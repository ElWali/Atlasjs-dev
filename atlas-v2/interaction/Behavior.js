/**
 * The base class for all user interaction handlers (behaviors) in Atlas.js.
 * It provides a standard interface for enabling and disabling interactions.
 */
class Behavior {
  constructor(engine) {
    this.engine = engine;
    this._enabled = false;
  }

  /**
   * Enables the behavior. This method should be implemented by subclasses
   * to add the necessary event listeners.
   */
  enable() {
    if (this._enabled) { return; }
    this._enabled = true;
    this.addHooks();
  }

  /**
   * Disables the behavior. This method should be implemented by subclasses
   * to remove the event listeners.
   */
  disable() {
    if (!this._enabled) { return; }
    this._enabled = false;
    this.removeHooks();
  }

  /**
   * Returns true if the behavior is currently enabled.
   * @returns {boolean}
   */
  enabled() {
    return this._enabled;
  }

  /**
   * Placeholder method for adding event listeners.
   * Must be implemented by subclasses.
   */
  addHooks() {
    throw new Error('The addHooks() method must be implemented by subclasses.');
  }

  /**
   * Placeholder method for removing event listeners.
   * Must be implemented by subclasses.
   */
  removeHooks() {
    throw new Error('The removeHooks() method must be implemented by subclasses.');
  }
}

export default Behavior;