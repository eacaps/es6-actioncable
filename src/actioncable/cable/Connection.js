//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.
import ActionCable from '../Logger';

let slice = [].slice;
let indexOf = [].indexOf;

let MessageTypes = {
  welcome: 'welcome',
  ping: 'ping',
  confirmation: 'confirm_subscription',
  rejection: 'reject_subscription'
}

class Connection {
  constructor(consumer) {
    this.reopenDelay = 500;
    this.consumer = consumer;
    let _this = this;
    this.events = {
      message: (event) => {
        var identifier, message, ref, type;
        ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message, type = ref.type;
        switch (type) {
          case MessageTypes.welcome:
            return _this.consumer.connectionMonitor.connected();
          case MessageTypes.ping:
            return _this.consumer.connectionMonitor.ping();
          case MessageTypes.confirmation:
            return _this.consumer.subscriptions.notify(identifier, "connected");
          case MessageTypes.rejection:
            return _this.consumer.subscriptions.reject(identifier);
          default:
            if (identifier === MessageTypes.ping) {
              return _this.consumer.connectionMonitor.ping();
            }
            return _this.consumer.subscriptions.notify(identifier, "received", message);
        }
      },
      open: () => {
        ActionCable.log("WebSocket onopen event");
        _this.disconnected = false;
        return _this.consumer.subscriptions.reload();
      },
      close: () => {
        ActionCable.log("WebSocket onclose event");
        return _this.disconnect();
      },
      error: () => {
        ActionCable.log("WebSocket onerror event");
        return _this.disconnect();
      }
    }
    this.open();
  }

  send(data) {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  }

  open() {
    if (this.isAlive()) {
      ActionCable.log("Attemped to open WebSocket, but existing socket is " + (this.getState()));
      throw new Error("Existing connection must be closed before opening");
    } else {
      ActionCable.log("Opening WebSocket, current state is " + (this.getState()));
      if (this.webSocket != null) {
        this.uninstallEventHandlers();
      }
      //allow people to pass in their own method to create websockets
      if(this.consumer.options.createWebsocket) {
        this.webSocket = this.consumer.options.createWebsocket();
      } else {
        this.webSocket = new WebSocket(this.consumer.url);
      }
      this.installEventHandlers();
      return true;
    }
  }

  close() {
    var ref;
    return (ref = this.webSocket) != null ? ref.close() : void 0;
  }

  reopen() {
    ActionCable.log("Reopening WebSocket, current state is " + (this.getState()));
    if (this.isAlive()) {
      try {
        return this.close();
      } catch (error) {
        return ActionCable.log("Failed to reopen WebSocket", error);
      } finally {
        ActionCable.log("Reopening WebSocket in " + this.reopenDelay + "ms");
        setTimeout(this.open.bind(this), this.reopenDelay);
      }
    } else {
      return this.open();
    }
  }

  isOpen() {
    return this.isState("open");
  }

  isAlive() {
    return (this.webSocket != null) && !this.isState("closing", "closed");
  }

  isState() {
    var ref, states;
    states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return ref = this.getState(), indexOf.call(states, ref) >= 0;
  }

  getState() {
    var ref, state, value;
    for (state in WebSocket) {
      value = WebSocket[state];
      if (value === ((ref = this.webSocket) != null ? ref.readyState : void 0)) {
        return state.toLowerCase();
      }
    }
    return null;
  }

  installEventHandlers() {
    var eventName, handler;
    for (eventName in this.events) {
      handler = this.events[eventName].bind(this);
      this.webSocket["on" + eventName] = handler;
    }
  };

  uninstallEventHandlers() {
    var eventName;
    for (eventName in this.events) {
      this.webSocket["on" + eventName] = () => {};
    }
  };

  disconnect() {
    if (this.disconnected) {
      return;
    }
    this.disconnected = true;
    this.consumer.connectionMonitor.disconnected();
    return this.consumer.subscriptions.notifyAll("disconnected");
  }

  toJSON() {
    return {
      state: this.getState()
    };
  }
}

export default Connection;
