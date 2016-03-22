//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.

var slice = [].slice;
var indexOf = [].indexOf;

class Connection {
  constructor(consumer) {
    this.consumer = consumer;
    let _this = this;
    this.events = {
      message: function(event) {
        var identifier, message, ref;
        ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message;
        return _this.consumer.subscriptions.notify(identifier, "received", message);
      },
      open: function() {
        return _this.consumer.subscriptions.reload();
      },
      close: function() {
        return _this.consumer.subscriptions.notifyAll("disconnected");
      },
      error: function() {
        this.consumer.subscriptions.notifyAll("disconnected");
        return _this.closeSilently();
      }
    };
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
    if (this.isState("open", "connecting")) {
      return;
    }
    this.webSocket = new WebSocket(this.consumer.url);
    return this.installEventHandlers();
  }

  close() {
    var ref;
    if (this.isState("closed", "closing")) {
      return;
    }
    return (ref = this.webSocket) != null ? ref.close() : void 0;
  }

  reopen() {
    if (this.isOpen()) {
      return this.closeSilently((function(_this) {
        return function() {
          return _this.open();
        };
      })(this));
    } else {
      return this.open();
    }
  }

  isOpen() {
    return this.isState("open");
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

  closeSilently(callback) {
    if (callback == null) {
      callback = function() {};
    }
    this.uninstallEventHandlers();
    this.installEventHandler("close", callback);
    this.installEventHandler("error", callback);
    try {
      return this.webSocket.close();
    } finally {
      this.uninstallEventHandlers();
    }
  }

  installEventHandlers() {
    var eventName, results;
    results = [];
    for (eventName in this.events) {
      results.push(this.installEventHandler(eventName));
    }
    return results;
  };

  installEventHandler(eventName, handler) {
    if (handler == null) {
      handler = this.events[eventName].bind(this);
    }
    return this.webSocket.addEventListener(eventName, handler);
  };

  uninstallEventHandlers() {
    var eventName, results;
    results = [];
    for (eventName in this.events) {
      results.push(this.webSocket.removeEventListener(eventName, this.events[eventName]));
    }
    return results;
  };

  toJSON() {
    return {
      state: this.getState()
    };
  };
}

export default Connection;
