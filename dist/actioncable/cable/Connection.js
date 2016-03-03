'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.


var _Logger = require('../Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var slice = [].slice;
var indexOf = [].indexOf;

var MessageTypes = {
  welcome: 'welcome',
  ping: 'ping',
  confirmation: 'confirm_subscription',
  rejection: 'reject_subscription'
};

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
          case MessageTypes.welcome:
            return _this.consumer.connectionMonitor.connected();
          case MessageTypes.ping:
            return _this.consumer.connectionMonitor.ping();
          case MessageTypes.confirmation:
            return _this.consumer.subscriptions.notify(identifier, "connected");
          case MessageTypes.rejection:
            return _this.consumer.subscriptions.reject(identifier);
          default:
            return _this.consumer.subscriptions.notify(identifier, "received", message);
        }
      },
      open: function open() {
        _Logger2.default.log("WebSocket onopen event");
        _this.disconnected = false;
        return _this.consumer.subscriptions.reload();
      },
      close: function close() {
        _Logger2.default.log("WebSocket onclose event");
        return _this.disconnect();
      },
      error: function error() {
        _Logger2.default.log("WebSocket onerror event");
        return _this.disconnect();
      }
    };
    this.open();
  }

  _createClass(Connection, [{
    key: 'send',
    value: function send(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: 'open',
    value: function open() {
      if (this.isAlive()) {
        _Logger2.default.log("Attemped to open WebSocket, but existing socket is " + this.getState());
        throw new Error("Existing connection must be closed before opening");
      } else {
        _Logger2.default.log("Opening WebSocket, current state is " + this.getState());
        if (this.webSocket != null) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new WebSocket(this.consumer.url);
        this.installEventHandlers();
        return true;
      }
    }
  }, {
    key: 'close',
    value: function close() {
      var ref;
      return (ref = this.webSocket) != null ? ref.close() : void 0;
    }
  }, {
    key: 'reopen',
    value: function reopen() {
      _Logger2.default.log("Reopening WebSocket, current state is " + this.getState());
      if (this.isAlive()) {
        try {
          return this.close();
        } catch (error) {
          return _Logger2.default.log("Failed to reopen WebSocket", error);
        } finally {
          _Logger2.default.log("Reopening WebSocket in " + this.reopenDelay + "ms");
          setTimeout(this.open.bind(this), this.reopenDelay);
        }
      } else {
        return this.open();
      }
    }
  }, {
    key: 'isOpen',
    value: function isOpen() {
      return this.isState("open");
    }
  }, {
    key: 'isAlive',
    value: function isAlive() {
      return this.webSocket != null && !this.isState("closing", "closed");
    }
  }, {
    key: 'isState',
    value: function isState() {
      var ref, states;
      states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return ref = this.getState(), indexOf.call(states, ref) >= 0;
    }
  }, {
    key: 'getState',
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
    key: 'installEventHandlers',
    value: function installEventHandlers() {
      var eventName, handler;
      for (eventName in this.events) {
        handler = this.events[eventName].bind(this);
        this.webSocket["on" + eventName] = handler;
      }
    }
  }, {
    key: 'uninstallEventHandlers',
    value: function uninstallEventHandlers() {
      var eventName;
      for (eventName in this.events) {
        this.webSocket["on" + eventName] = function () {};
      }
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      if (this.disconnected) {
        return;
      }
      this.disconnected = true;
      this.consumer.connectionMonitor.disconnected();
      return this.consumer.subscriptions.notifyAll("disconnected");
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        state: this.getState()
      };
    }
  }]);

  return Connection;
}();

exports.default = Connection;