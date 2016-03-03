"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.

var slice = [].slice;
var indexOf = [].indexOf;

var Connection = function () {
  function Connection(consumer) {
    _classCallCheck(this, Connection);

    this.reopenDelay = 500;
    this.consumer = consumer;
    var _this = this;
    this.events = {
      message: function message(event) {
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
      open: function open() {
        ActionCable.log("WebSocket onopen event");
        this.disconnected = false;
        return this.consumer.subscriptions.reload();
      },
      close: function close() {
        ActionCable.log("WebSocket onclose event");
        return this.disconnect();
      },
      error: function error() {
        ActionCable.log("WebSocket onerror event");
        return this.disconnect();
      }
    };
    this.open();
  }

  _createClass(Connection, [{
    key: "send",
    value: function send(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "open",
    value: function open() {
      if (this.isAlive()) {
        ActionCable.log("Attemped to open WebSocket, but existing socket is " + this.getState());
        throw new Error("Existing connection must be closed before opening");
      } else {
        ActionCable.log("Opening WebSocket, current state is " + this.getState());
        if (this.webSocket != null) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new WebSocket(this.consumer.url);
        this.installEventHandlers();
        return true;
      }
    }
  }, {
    key: "close",
    value: function close() {
      var ref;
      return (ref = this.webSocket) != null ? ref.close() : void 0;
    }
  }, {
    key: "reopen",
    value: function reopen() {
      ActionCable.log("Reopening WebSocket, current state is " + this.getState());
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
  }, {
    key: "isOpen",
    value: function isOpen() {
      return this.isState("open");
    }
  }, {
    key: "isAlive",
    value: function isAlive() {
      return this.webSocket != null && !this.isState("closing", "closed");
    }
  }, {
    key: "isState",
    value: function isState() {
      var ref, states;
      states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return ref = this.getState(), indexOf.call(states, ref) >= 0;
    }
  }, {
    key: "getState",
    value: function getState() {
      var ref, state, value;
      for (state in WebSocket) {
        value = WebSocket[state];
        if (value === ((ref = this.webSocket) != null ? ref.readyState : void 0)) {
          return state.toLowerCase();
        }
      }
      return null;
    }
  }, {
    key: "installEventHandlers",
    value: function installEventHandlers() {
      var eventName, handler;
      for (eventName in this.events) {
        handler = this.events[eventName].bind(this);
        this.webSocket["on" + eventName] = handler;
      }
    }
  }, {
    key: "uninstallEventHandlers",
    value: function uninstallEventHandlers() {
      var eventName;
      for (eventName in this.events) {
        this.webSocket["on" + eventName] = function () {};
      }
    }
  }, {
    key: "disconnet",
    value: function disconnet() {
      if (this.disconnected) {
        return;
      }
      this.disconnected = true;
      this.consumer.connectionMonitor.disconnected();
      return this.consumer.subscriptions.notifyAll("disconnected");
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        state: this.getState()
      };
    }
  }]);

  return Connection;
}();

exports.default = Connection;