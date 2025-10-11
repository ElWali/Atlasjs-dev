class CommandBus {
  constructor() {
    this.handlers = {};
  }

  register(commandName, handler) {
    this.handlers[commandName] = handler;
  }

  execute(commandName, payload) {
    const handler = this.handlers[commandName];
    if (handler) {
      return handler(payload);
    }
    throw new Error(`No handler registered for command: ${commandName}`);
  }
}

export default CommandBus;