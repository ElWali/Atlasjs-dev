class StateManager {
  constructor() {
    this.state = {};
    this.listeners = {};
  }

  set(key, value) {
    this.state[key] = value;
    if (this.listeners[key]) {
      this.listeners[key].forEach(listener => listener(value));
    }
  }

  get(key) {
    return this.state[key];
  }

  watch(key, listener) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(listener);
  }

  unwatch(key, listener) {
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter(l => l !== listener);
    }
  }
}

export default StateManager;