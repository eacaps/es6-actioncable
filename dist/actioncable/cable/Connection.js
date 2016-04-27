//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var slice = [].slice;
var indexOf = [].indexOf;

var Connection = (function () {
  function Connection(consumer) {
    _classCallCheck(this, Connection);

    this.consumer = consumer;
    var _this = this;
    this.events = {
      message: function message(event) {
        var identifier, message, ref, type;
        ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message, type = ref.type;
        if (['confirm_subscription', 'reject_subscription'].indexOf(type) >= 0) {
          return;
        }
        return _this.consumer.subscriptions.notify(identifier, "received", message);
      },
      open: function open() {
        return _this.consumer.subscriptions.reload();
      },
      close: function close() {
        return _this.consumer.subscriptions.notifyAll("disconnected");
      },
      error: function error() {
        this.consumer.subscriptions.notifyAll("disconnected");
        return _this.closeSilently();
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
      if (this.isState("open", "connecting")) {
        return;
      }
      if (this.consumer.options.createWebsocket) {
        this.webSocket = this.consumer.options.createWebsocket();
      } else {
        this.webSocket = new WebSocket(this.consumer.url);
      }
      return this.installEventHandlers();
    }
  }, {
    key: 'close',
    value: function close() {
      var ref;
      if (this.isState("closed", "closing")) {
        return;
      }
      return (ref = this.webSocket) != null ? ref.close() : void 0;
    }
  }, {
    key: 'reopen',
    value: function reopen() {
      if (this.isOpen()) {
        return this.closeSilently((function (_this) {
          return function () {
            return _this.open();
          };
        })(this));
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
      var states = ['connecting', 'open', 'closing', 'closed'];
      if (this.webSocket) {
        return states[this.webSocket.readyState];
      }
    }
  }, {
    key: 'closeSilently',
    value: function closeSilently(callback) {
      if (callback == null) {
        callback = function () {};
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
  }, {
    key: 'installEventHandlers',
    value: function installEventHandlers() {
      var eventName, results;
      results = [];
      for (eventName in this.events) {
        results.push(this.installEventHandler(eventName));
      }
      return results;
    }
  }, {
    key: 'installEventHandler',
    value: function installEventHandler(eventName, handler) {
      if (handler == null) {
        handler = this.events[eventName].bind(this);
      }
      return this.webSocket.addEventListener(eventName, handler);
    }
  }, {
    key: 'uninstallEventHandlers',
    value: function uninstallEventHandlers() {
      var eventName, results;
      results = [];
      for (eventName in this.events) {
        results.push(this.webSocket.removeEventListener(eventName, this.events[eventName]));
      }
      return results;
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
})();

exports['default'] = Connection;
module.exports = exports['default'];