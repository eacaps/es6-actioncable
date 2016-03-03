//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.
import ActionCable from '../Logger';

var slice = [].slice;
var indexOf = [].indexOf;

class Connection {
  constructor(consumer) {
    this.reopenDelay = 500;
    this.consumer = consumer;
    let _this = this;
    this.events = {
      message: function(event) {
        var identifier, message, ref, type;
        ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message, type = ref.type;
        switch (type) {
          case message_types.welcome:
            return this.consumer.connectionMonitor.connected();
          case message_types.ping:
            return this.consumer.connectionMonitor.ping();
          case message_types.confirmation:
            return this.consumer.subscriptions.notify(identifier, "connected");
          case message_types.rejection:
            return this.consumer.subscriptions.reject(identifier);
          default:
            return this.consumer.subscriptions.notify(identifier, "received", message);
        }
      },
      open: function() {
        ActionCable.log("WebSocket onopen event");
        this.disconnected = false;
        return this.consumer.subscriptions.reload();
      },
      close: function() {
        ActionCable.log("WebSocket onclose event");
        return this.disconnect();
      },
      error: function() {
        ActionCable.log("WebSocket onerror event");
        return this.disconnect();
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
      this.webSocket = new WebSocket(this.consumer.url);
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
        setTimeout(this.open, this.constructor.reopenDelay);
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

  disconnet() {
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
