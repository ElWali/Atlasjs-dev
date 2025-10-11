class Surface {
  constructor(engine) {
    this.engine = engine;
  }

  onMount() {
    // Optional: To be implemented by subclasses for setup logic
  }

  onUnmount() {
    // Optional: To be implemented by subclasses for teardown logic
  }

  render(renderer) {
    // This method must be implemented by subclasses
    throw new Error('The render() method must be implemented by subclasses.');
  }
}

export default Surface;