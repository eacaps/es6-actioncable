// # Encapsulate the cable connection held by the consumer.
// This is an internal class not intended for direct user manipulation.
import ActionCable from '../Logger';

const slice = [].slice;
const indexOf = [].indexOf;

const MessageTypes = {
  welcome: 'welcome',
  ping: 'ping',
  confirmation: 'confirm_subscription',
  rejection: 'reject_subscription',
};

class Connection {
  constructor(consumer) {
    this.reopenDelay = 500;
    this.consumer = consumer;
    const that = this;
    this.events = {
      message: (event) => {
        const ref = JSON.parse(event.data);
        const identifier = ref.identifier;
        const message = ref.message;
        const type = ref.type;
        switch (type) {
          case MessageTypes.welcome:
            return that.consumer.connectionMonitor.connected();
          case MessageTypes.ping:
            return that.consumer.connectionMonitor.ping();
          case MessageTypes.confirmation:
            return that.consumer.subscriptions.notify(identifier, 'connected');
          case MessageTypes.rejection:
            return that.consumer.subscriptions.reject(identifier);
          default:
            if (identifier === MessageTypes.ping) {
              return that.consumer.connectionMonitor.ping();
            }
            return that.consumer.subscriptions.notify(identifier, 'received', message);
        }
      },
      open: () => {
        ActionCable.log('WebSocket onopen event');
        that.disconnected = false;
        return that.consumer.subscriptions.reload();
      },
      close: () => {
        ActionCable.log('WebSocket onclose event');
        return that.disconnect();
      },
      error: () => {
        ActionCable.log('WebSocket onerror event');
        return that.disconnect();
      },
    };
    this.open();
  }

  send(data) {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  open() {
    if (this.isAlive()) {
      ActionCable.log(`Attemped to open WebSocket, but existing socket is ${this.getState()}`);
      throw new Error('Existing connection must be closed before opening');
    } else {
      ActionCable.log(`Opening WebSocket, current state is ${this.getState()}`);
      if (this.webSocket != null) {
        this.uninstallEventHandlers();
      }
      // allow people to pass in their own method to create websockets
      if (this.consumer.options.createWebsocket) {
        this.webSocket = this.consumer.options.createWebsocket(this.consumer.options);
      } else {
        this.webSocket = new WebSocket(this.consumer.url);
      }
      this.installEventHandlers();
      return true;
    }
  }

  close() {
    return this.webSocket != null ? this.webSocket.close() : true;
  }

  reopen() {
    ActionCable.log(`Reopening WebSocket, current state is ${this.getState()}`);
    if (this.isAlive()) {
      try {
        return this.close();
      } catch (error) {
        return ActionCable.log('Failed to reopen WebSocket', error);
      } finally {
        ActionCable.log(`Reopening WebSocket in ${this.reopenDelay}ms`);
        setTimeout(this.open.bind(this), this.reopenDelay);
      }
    } else {
      return this.open();
    }
  }

  isOpen() {
    return this.isState('open');
  }

  isAlive() {
    return (this.webSocket != null) && !this.isState('closing', 'closed');
  }

  isState(...args) {
    const states = args.length <= 1 ? slice.call(args, 0) : [];
    const ref = this.getState();
    return indexOf.call(states, ref) >= 0;
  }

  getState() {
    const states = ['connecting', 'open', 'closing', 'closed'];
    if (this.webSocket) {
      return states[this.webSocket.readyState];
    }
    return true;
  }

  installEventHandlers() {
    let eventName;
    let handler;
    /* eslint-disable */
    for (eventName in this.events) {
      handler = this.events[eventName].bind(this);
      this.webSocket[`on${eventName}`] = handler;
    }
    /* eslint-enable */
  }

  uninstallEventHandlers() {
    let eventName;
    /* eslint-disable */
    for (eventName in this.events) {
      this.webSocket[`on${eventName}`] = () => {};
    }
    /* eslint-enable */
  }

  disconnect() {
    if (this.disconnected) {
      return;
    }
    this.disconnected = true;
    this.consumer.connectionMonitor.disconnected();
    this.consumer.subscriptions.notifyAll('disconnected');
  }

  toJSON() {
    return {
      state: this.getState(),
    };
  }
}

export default Connection;
