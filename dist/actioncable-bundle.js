(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _cableConsumer = require('./cable/Consumer');

var _cableConsumer2 = _interopRequireDefault(_cableConsumer);

exports["default"] = {
  PING_IDENTIFIER: "_ping",
  createConsumer: function createConsumer(url) {
    return new _cableConsumer2["default"](url);
  },
  // eac added 20150908
  endConsumer: function endConsumer(consumer) {
    consumer.connection.close();
    consumer.connectionMonitor.stop();
  }
};
module.exports = exports["default"];

},{"./cable/Consumer":4}],2:[function(require,module,exports){
//# Encapsulate the cable connection held by the consumer. This is an internal class not intended for direct user manipulation.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var slice = [].slice;
var indexOf = [].indexOf;

var Connection = (function () {
  function Connection(consumer) {
    _classCallCheck(this, Connection);

    this.consumer = consumer;
    var _this = this;
    this.events = {
      message: function message(event) {
        var identifier, message, ref;
        ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message;
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
      if (this.isState("open", "connecting")) {
        return;
      }
      this.webSocket = new WebSocket(this.consumer.url);
      return this.installEventHandlers();
    }
  }, {
    key: "close",
    value: function close() {
      var ref;
      if (this.isState("closed", "closing")) {
        return;
      }
      return (ref = this.webSocket) != null ? ref.close() : void 0;
    }
  }, {
    key: "reopen",
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
    key: "isOpen",
    value: function isOpen() {
      return this.isState("open");
    }
  }, {
    key: "isState",
    value: function isState() {
      var ref, states;
      states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.getState(), indexOf.call(states, ref) >= 0);
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
    key: "closeSilently",
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
    key: "installEventHandlers",
    value: function installEventHandlers() {
      var eventName, results;
      results = [];
      for (eventName in this.events) {
        results.push(this.installEventHandler(eventName));
      }
      return results;
    }
  }, {
    key: "installEventHandler",
    value: function installEventHandler(eventName, handler) {
      if (handler == null) {
        handler = this.events[eventName].bind(this);
      }
      return this.webSocket.addEventListener(eventName, handler);
    }
  }, {
    key: "uninstallEventHandlers",
    value: function uninstallEventHandlers() {
      var eventName, results;
      results = [];
      for (eventName in this.events) {
        results.push(this.webSocket.removeEventListener(eventName));
      }
      return results;
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
})();

exports["default"] = Connection;
module.exports = exports["default"];

},{}],3:[function(require,module,exports){
/*
# Responsible for ensuring the cable connection is in good health by validating the heartbeat pings sent from the server, and attempting
# revival reconnections if things go astray. Internal class, not intended for direct user manipulation.
*/
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Cable = require('../Cable');

var _Cable2 = _interopRequireDefault(_Cable);

var now = function now() {
  return new Date().getTime();
};

var secondsSince = function secondsSince(time) {
  return (now() - time) / 1000;
};

var clamp = function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
};

var ConnectionMonitor = (function () {
  function ConnectionMonitor(consumer) {
    _classCallCheck(this, ConnectionMonitor);

    this.pollInterval = {
      min: 2,
      max: 30
    };
    this.staleThreshold = {
      startedAt: 4,
      pingedAt: 8
    };
    this.identifier = _Cable2['default'].PING_IDENTIFIER;
    this.consumer = consumer;
    this.consumer.subscriptions.add(this);
    this.start();
  }

  _createClass(ConnectionMonitor, [{
    key: 'connected',
    value: function connected() {
      this.reset();
      return this.pingedAt = now();
    }
  }, {
    key: 'received',
    value: function received() {
      return this.pingedAt = now();
    }
  }, {
    key: 'reset',
    value: function reset() {
      return this.reconnectAttempts = 0;
    }
  }, {
    key: 'start',
    value: function start() {
      this.reset();
      delete this.stoppedAt;
      this.startedAt = now();
      return this.poll();
    }
  }, {
    key: 'stop',
    value: function stop() {
      return this.stoppedAt = now();
    }
  }, {
    key: 'poll',
    value: function poll() {
      return setTimeout((function (_this) {
        return function () {
          if (!_this.stoppedAt) {
            _this.reconnectIfStale();
            return _this.poll();
          }
        };
      })(this), this.getInterval());
    }
  }, {
    key: 'getInterval',
    value: function getInterval() {
      var interval, max, min, ref;
      ref = this.pollInterval, min = ref.min, max = ref.max;
      interval = 4 * Math.log(this.reconnectAttempts + 1);
      return clamp(interval, min, max) * 1000;
    }
  }, {
    key: 'reconnectIfStale',
    value: function reconnectIfStale() {
      if (this.connectionIsStale()) {
        this.reconnectAttempts += 1;
        return this.consumer.connection.reopen();
      }
    }
  }, {
    key: 'connectionIsStale',
    value: function connectionIsStale() {
      if (this.pingedAt) {
        return secondsSince(this.pingedAt) > this.staleThreshold.pingedAt;
      } else {
        return secondsSince(this.startedAt) > this.staleThreshold.startedAt;
      }
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var connectionIsStale, interval;
      interval = this.getInterval();
      connectionIsStale = this.connectionIsStale();
      return {
        startedAt: this.startedAt,
        stoppedAt: this.stoppedAt,
        pingedAt: this.pingedAt,
        reconnectAttempts: this.reconnectAttempts,
        connectionIsStale: connectionIsStale,
        interval: interval
      };
    }
  }]);

  return ConnectionMonitor;
})();

exports['default'] = ConnectionMonitor;
module.exports = exports['default'];

},{"../Cable":1}],4:[function(require,module,exports){
/*
# The Cable.Consumer establishes the connection to a server-side Ruby Connection object. Once established,
# the Cable.ConnectionMonitor will ensure that its properly maintained through heartbeats and checking for stale updates.
# The Consumer instance is also the gateway to establishing subscriptions to desired channels through the #createSubscription
# method.
#
# The following example shows how this can be setup:
#
#   @App = {}
#   App.cable = Cable.createConsumer "ws://example.com/accounts/1"
#   App.appearance = App.cable.subscriptions.create "AppearanceChannel"
#
# For more details on how you'd configure an actual channel subscription, see Cable.Subscription.
*/
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Subscription = require('./Subscription');

var _Subscription2 = _interopRequireDefault(_Subscription);

var _Subscriptions = require('./Subscriptions');

var _Subscriptions2 = _interopRequireDefault(_Subscriptions);

var _Connection = require('./Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _ConnectionMonitor = require('./ConnectionMonitor');

var _ConnectionMonitor2 = _interopRequireDefault(_ConnectionMonitor);

var Consumer = (function () {
  function Consumer(url) {
    _classCallCheck(this, Consumer);

    this.url = url;
    this.subscriptions = new _Subscriptions2['default'](this);
    this.connection = new _Connection2['default'](this);
    this.connectionMonitor = new _ConnectionMonitor2['default'](this);
  }

  _createClass(Consumer, [{
    key: 'send',
    value: function send(data) {
      return this.connection.send(data);
    }
  }, {
    key: 'inspect',
    value: function inspect() {
      JSON.stringify(this, null, 2);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        url: this.url,
        subscriptions: this.subscriptions,
        connection: this.connection,
        connectionMonitor: this.connectionMonitor
      };
    }
  }]);

  return Consumer;
})();

exports['default'] = Consumer;
module.exports = exports['default'];

},{"./Connection":2,"./ConnectionMonitor":3,"./Subscription":5,"./Subscriptions":6}],5:[function(require,module,exports){
/*
# A new subscription is created through the Cable.Subscriptions instance available on the consumer. 
# It provides a number of callbacks and a method for calling remote procedure calls on the corresponding 
# Channel instance on the server side.
#
# An example demonstrates the basic functionality:
#
#   App.appearance = App.cable.subscriptions.create "AppearanceChannel",
#     connected: ->
#       # Called once the subscription has been successfully completed
#   
#     appear: ->
#       @perform 'appear', appearing_on: @appearingOn()
#   
#     away: ->
#       @perform 'away'
#   
#     appearingOn: ->
#       $('main').data 'appearing-on'
#
# The methods #appear and #away forward their intent to the remote AppearanceChannel instance on the server
# by calling the `@perform` method with the first parameter being the action (which maps to AppearanceChannel#appear/away).
# The second parameter is a hash that'll get JSON encoded and made available on the server in the data parameter.
#
# This is how the server component would look:
#
#   class AppearanceChannel < ApplicationCable::Channel
#     def subscribed
#       current_user.appear
#     end
#   
#     def unsubscribed
#       current_user.disappear
#     end
#   
#     def appear(data)
#       current_user.appear on: data['appearing_on']
#     end
#   
#     def away
#       current_user.away
#     end
#   end
#
# The "AppearanceChannel" name is automatically mapped between the client-side subscription creation and the server-side Ruby class name.
# The AppearanceChannel#appear/away public methods are exposed automatically to client-side invocation through the @perform method.
*/

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var extend = function extend(object, properties) {
  var key, value;
  if (properties != null) {
    for (key in properties) {
      value = properties[key];
      object[key] = value;
    }
  }
  return object;
};

var Subscription = (function () {
  function Subscription(subscriptions, params, mixin) {
    _classCallCheck(this, Subscription);

    this.subscriptions = subscriptions;
    if (params == null) {
      params = {};
    }
    this.identifier = JSON.stringify(params);
    extend(this, mixin);
    this.consumer = this.subscriptions.consumer;
    this.subscriptions.add(this);
  }

  _createClass(Subscription, [{
    key: "perform",
    value: function perform(action, data) {
      if (data == null) {
        data = {};
      }
      data.action = action;
      return this.send(data);
    }
  }, {
    key: "send",
    value: function send(data) {
      return this.consumer.send({
        command: "message",
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe() {
      return this.subscriptions.remove(this);
    }
  }]);

  return Subscription;
})();

exports["default"] = Subscription;
module.exports = exports["default"];

},{}],6:[function(require,module,exports){
/*
# Collection class for creating (and internally managing) channel subscriptions. The only method intended to be triggered by the user
# us Cable.Subscriptions#create, and it should be called through the consumer like so:
#
#   @App = {}
#   App.cable = Cable.createConsumer "ws://example.com/accounts/1"
#   App.appearance = App.cable.subscriptions.create "AppearanceChannel"
#
# For more details on how you'd configure an actual channel subscription, see Cable.Subscription.
*/

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Subscription = require('./Subscription');

var _Subscription2 = _interopRequireDefault(_Subscription);

var _Cable = require('../Cable');

var _Cable2 = _interopRequireDefault(_Cable);

var slice = [].slice;

var Subscriptions = (function () {
  function Subscriptions(consumer) {
    _classCallCheck(this, Subscriptions);

    this.consumer = consumer;
    this.subscriptions = [];
  }

  _createClass(Subscriptions, [{
    key: 'create',
    value: function create(channelName, mixin) {
      var channel, params;
      channel = channelName;
      params = typeof channel === "object" ? channel : {
        channel: channel
      };
      return new _Subscription2['default'](this, params, mixin);
    }
  }, {
    key: 'add',
    value: function add(subscription) {
      this.subscriptions.push(subscription);
      this.notify(subscription, "initialized");
      if (this.sendCommand(subscription, "subscribe")) {
        return this.notify(subscription, "connected");
      }
    }
  }, {
    key: 'reload',
    value: function reload() {
      var i, len, ref, results, subscription;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        if (this.sendCommand(subscription, "subscribe")) {
          results.push(this.notify(subscription, "connected"));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  }, {
    key: 'remove',
    value: function remove(subscription) {
      var s;
      this.subscriptions = (function () {
        var i, len, ref, results;
        ref = this.subscriptions;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          s = ref[i];
          if (s !== subscription) {
            results.push(s);
          }
        }
        return results;
      }).call(this);
      if (!this.findAll(subscription.identifier).length) {
        return this.sendCommand(subscription, "unsubscribe");
      }
    }
  }, {
    key: 'findAll',
    value: function findAll(identifier) {
      var i, len, ref, results, s;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        if (s.identifier === identifier) {
          results.push(s);
        }
      }
      return results;
    }
  }, {
    key: 'notifyAll',
    value: function notifyAll() {
      var args, callbackName, i, len, ref, results, subscription;
      callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
      }
      return results;
    }
  }, {
    key: 'notify',
    value: function notify() {
      var args, callbackName, i, len, results, subscription, subscriptions;
      subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (typeof subscription === "string") {
        subscriptions = this.findAll(subscription);
      } else {
        subscriptions = [subscription];
      }
      results = [];
      for (i = 0, len = subscriptions.length; i < len; i++) {
        subscription = subscriptions[i];
        results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
      }
      return results;
    }
  }, {
    key: 'sendCommand',
    value: function sendCommand(subscription, command) {
      var identifier;
      identifier = subscription.identifier;
      if (identifier === _Cable2['default'].PING_IDENTIFIER) {
        return this.consumer.connection.isOpen();
      } else {
        return this.consumer.send({
          command: command,
          identifier: identifier
        });
      }
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var i, len, ref, results, subscription;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(subscription.identifier);
      }
      return results;
    }
  }]);

  return Subscriptions;
})();

exports['default'] = Subscriptions;
module.exports = exports['default'];

},{"../Cable":1,"./Subscription":5}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi93b3Jrc3BhY2UvZmZhLWRpci9lczYtYWN0aW9uY2FibGUvc3JjL2FjdGlvbmNhYmxlL0NhYmxlLmpzIiwiL3dvcmtzcGFjZS9mZmEtZGlyL2VzNi1hY3Rpb25jYWJsZS9zcmMvYWN0aW9uY2FibGUvY2FibGUvQ29ubmVjdGlvbi5qcyIsIi93b3Jrc3BhY2UvZmZhLWRpci9lczYtYWN0aW9uY2FibGUvc3JjL2FjdGlvbmNhYmxlL2NhYmxlL0Nvbm5lY3Rpb25Nb25pdG9yLmpzIiwiL3dvcmtzcGFjZS9mZmEtZGlyL2VzNi1hY3Rpb25jYWJsZS9zcmMvYWN0aW9uY2FibGUvY2FibGUvQ29uc3VtZXIuanMiLCIvd29ya3NwYWNlL2ZmYS1kaXIvZXM2LWFjdGlvbmNhYmxlL3NyYy9hY3Rpb25jYWJsZS9jYWJsZS9TdWJzY3JpcHRpb24uanMiLCIvd29ya3NwYWNlL2ZmYS1kaXIvZXM2LWFjdGlvbmNhYmxlL3NyYy9hY3Rpb25jYWJsZS9jYWJsZS9TdWJzY3JpcHRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7NkJDQXFCLGtCQUFrQjs7OztxQkFFeEI7QUFDYixpQkFBZSxFQUFFLE9BQU87QUFDeEIsZ0JBQWMsRUFBRSx3QkFBQyxHQUFHLEVBQUs7QUFDdkIsV0FBTywrQkFBYSxHQUFHLENBQUMsQ0FBQztHQUMxQjs7QUFFRCxhQUFXLEVBQUUscUJBQUMsUUFBUSxFQUFLO0FBQ3pCLFlBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsWUFBUSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO0dBQ25DO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUNWRCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQ3JCLElBQUksT0FBTyxH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b0JBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztPQUNKO0tBQ0Y7OztXQUVLLGtCQUFHO0FBQ1AsVUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDO0FBQ3ZDLFNBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQ3pCLGFBQU8sR0FBRyxFQUFFLENBQUM7QUFDYixXQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMxQyxvQkFBWSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixlQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUN2QztBQUNELGFBQU8sT0FBTyxDQUFDO0tBQ2hCOzs7U0F4SEcsYUFBYTs7O3FCQTRISixhQUFhIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBDb25zdW1lciBmcm9tICcuL2NhYmxlL0NvbnN1bWVyJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICBQSU5HX0lERU5USUZJRVI6IFwiX3BpbmdcIixcbiAgY3JlYXRlQ29uc3VtZXI6ICh1cmwpID0+IHtcbiAgICByZXR1cm4gbmV3IENvbnN1bWVyKHVybCk7XG4gIH0sXG4gIC8vIGVhYyBhZGRlZCAyMDE1MDkwOFxuICBlbmRDb25zdW1lcjogKGNvbnN1bWVyKSA9PiB7XG4gICAgY29uc3VtZXIuY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgIGNvbnN1bWVyLmNvbm5lY3Rpb25Nb25pdG9yLnN0b3AoKTtcbiAgfVxufTsiLCIvLyMgRW5jYXBzdWxhdGUgdGhlIGNhYmxlIGNvbm5lY3Rpb24gaGVsZCBieSB0aGUgY29uc3VtZXIuIFRoaXMgaXMgYW4gaW50ZXJuYWwgY2xhc3Mgbm90IGludGVuZGVkIGZvciBkaXJlY3QgdXNlciBtYW5pcHVsYXRpb24uXG5cbnZhciBzbGljZSA9IFtdLnNsaWNlO1xudmFyIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG5jbGFzcyBDb25uZWN0aW9uIHtcbiAgY29uc3RydWN0b3IoY29uc3VtZXIpIHtcbiAgICB0aGlzLmNvbnN1bWVyID0gY29uc3VtZXI7XG4gICAgbGV0IF90aGlzID0gdGhpcztcbiAgICB0aGlzLmV2ZW50cyA9IHtcbiAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBpZGVudGlmaWVyLCBtZXNzYWdlLCByZWY7XG4gICAgICAgIHJlZiA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSksIGlkZW50aWZpZXIgPSByZWYuaWRlbnRpZmllciwgbWVzc2FnZSA9IHJlZi5tZXNzYWdlO1xuICAgICAgICByZXR1cm4gX3RoaXMuY29uc3VtZXIuc3Vic2NyaXB0aW9ucy5ub3RpZnkoaWRlbnRpZmllciwgXCJyZWNlaXZlZFwiLCBtZXNzYWdlKTtcbiAgICAgIH0sXG4gICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLmNvbnN1bWVyLnN1YnNjcmlwdGlvbnMucmVsb2FkKCk7XG4gICAgICB9LFxuICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMuY29uc3VtZXIuc3Vic2NyaXB0aW9ucy5ub3RpZnlBbGwoXCJkaXNjb25uZWN0ZWRcIik7XG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNvbnN1bWVyLnN1YnNjcmlwdGlvbnMubm90aWZ5QWxsKFwiZGlzY29ubmVjdGVkXCIpO1xuICAgICAgICByZXR1cm4gX3RoaXMuY2xvc2VTaWxlbnRseSgpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5vcGVuKCk7XG4gIH1cblxuICBzZW5kKGRhdGEpIHtcbiAgICBpZiAodGhpcy5pc09wZW4oKSkge1xuICAgICAgdGhpcy53ZWJTb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG9wZW4oKSB7XG4gICAgaWYgKHRoaXMuaXNTdGF0ZShcIm9wZW5cIiwgXCJjb25uZWN0aW5nXCIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMud2ViU29ja2V0ID0gbmV3IFdlYlNvY2tldCh0aGlzLmNvbnN1bWVyLnVybCk7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFsbEV2ZW50SGFuZGxlcnMoKTtcbiAgfVxuXG4gIGNsb3NlKCkge1xuICAgIHZhciByZWY7XG4gICAgaWYgKHRoaXMuaXNTdGF0ZShcImNsb3NlZFwiLCBcImNsb3NpbmdcIikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIChyZWYgPSB0aGlzLndlYlNvY2tldCkgIT0gbnVsbCA/IHJlZi5jbG9zZSgpIDogdm9pZCAwO1xuICB9XG5cbiAgcmVvcGVuKCkge1xuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jbG9zZVNpbGVudGx5KChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLm9wZW4oKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIGlzT3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5pc1N0YXRlKFwib3BlblwiKTtcbiAgfVxuXG4gIGlzU3RhdGUoKSB7XG4gICAgdmFyIHJlZiwgc3RhdGVzO1xuICAgIHN0YXRlcyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIHJldHVybiByZWYgPSB0aGlzLmdldFN0YXRlKCksIGluZGV4T2YuY2FsbChzdGF0ZXMsIHJlZikgPj0gMDtcbiAgfVxuXG4gIGdldFN0YXRlKCkge1xuICAgIHZhciByZWYsIHN0YXRlLCB2YWx1ZTtcbiAgICBmb3IgKHN0YXRlIGluIFdlYlNvY2tldCkge1xuICAgICAgdmFsdWUgPSBXZWJTb2NrZXRbc3RhdGVdO1xuICAgICAgaWYgKHZhbHVlID09PSAoKHJlZiA9IHRoaXMud2ViU29ja2V0KSAhPSBudWxsID8gcmVmLnJlYWR5U3RhdGUgOiB2b2lkIDApKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNsb3NlU2lsZW50bHkoY2FsbGJhY2spIHtcbiAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgICB0aGlzLnVuaW5zdGFsbEV2ZW50SGFuZGxlcnMoKTtcbiAgICB0aGlzLmluc3RhbGxFdmVudEhhbmRsZXIoXCJjbG9zZVwiLCBjYWxsYmFjayk7XG4gICAgdGhpcy5pbnN0YWxsRXZlbnRIYW5kbGVyKFwiZXJyb3JcIiwgY2FsbGJhY2spO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy53ZWJTb2NrZXQuY2xvc2UoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy51bmluc3RhbGxFdmVudEhhbmRsZXJzKCk7XG4gICAgfVxuICB9XG5cbiAgaW5zdGFsbEV2ZW50SGFuZGxlcnMoKSB7XG4gICAgdmFyIGV2ZW50TmFtZSwgcmVzdWx0cztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChldmVudE5hbWUgaW4gdGhpcy5ldmVudHMpIHtcbiAgICAgIHJlc3VsdHMucHVzaCh0aGlzLmluc3RhbGxFdmVudEhhbmRsZXIoZXZlbnROYW1lKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIGluc3RhbGxFdmVudEhhbmRsZXIoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgPT0gbnVsbCkge1xuICAgICAgaGFuZGxlciA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMud2ViU29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgfTtcblxuICB1bmluc3RhbGxFdmVudEhhbmRsZXJzKCkge1xuICAgIHZhciBldmVudE5hbWUsIHJlc3VsdHM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoZXZlbnROYW1lIGluIHRoaXMuZXZlbnRzKSB7XG4gICAgICByZXN1bHRzLnB1c2godGhpcy53ZWJTb2NrZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0ZTogdGhpcy5nZXRTdGF0ZSgpXG4gICAgfTtcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29ubmVjdGlvbjsiLCIvKlxuIyBSZXNwb25zaWJsZSBmb3IgZW5zdXJpbmcgdGhlIGNhYmxlIGNvbm5lY3Rpb24gaXMgaW4gZ29vZCBoZWFsdGggYnkgdmFsaWRhdGluZyB0aGUgaGVhcnRiZWF0IHBpbmdzIHNlbnQgZnJvbSB0aGUgc2VydmVyLCBhbmQgYXR0ZW1wdGluZ1xuIyByZXZpdmFsIHJlY29ubmVjdGlvbnMgaWYgdGhpbmdzIGdvIGFzdHJheS4gSW50ZXJuYWwgY2xhc3MsIG5vdCBpbnRlbmRlZCBmb3IgZGlyZWN0IHVzZXIgbWFuaXB1bGF0aW9uLlxuKi9cbmltcG9ydCBDYWJsZSBmcm9tICcuLi9DYWJsZSc7XG5cbnZhciBub3cgPSAoKSA9PiB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbnZhciBzZWNvbmRzU2luY2UgPSAodGltZSkgPT4ge1xuICByZXR1cm4gKG5vdygpIC0gdGltZSkgLyAxMDAwO1xufTtcblxudmFyIGNsYW1wID0gKG51bWJlciwgbWluLCBtYXgpID0+IHtcbiAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCBudW1iZXIpKTtcbn07XG5cbmNsYXNzIENvbm5lY3Rpb25Nb25pdG9yIHtcblxuICBjb25zdHJ1Y3Rvcihjb25zdW1lcikge1xuICAgIHRoaXMucG9sbEludGVydmFsID0ge1xuICAgICAgbWluOiAyLFxuICAgICAgbWF4OiAzMFxuICAgIH07XG4gICAgdGhpcy5zdGFsZVRocmVzaG9sZCA9IHtcbiAgICAgIHN0YXJ0ZWRBdDogNCxcbiAgICAgIHBpbmdlZEF0OiA4XG4gICAgfTtcbiAgICB0aGlzLmlkZW50aWZpZXIgPSBDYWJsZS5QSU5HX0lERU5USUZJRVI7XG4gICAgdGhpcy5jb25zdW1lciA9IGNvbnN1bWVyO1xuICAgIHRoaXMuY29uc3VtZXIuc3Vic2NyaXB0aW9ucy5hZGQodGhpcyk7XG4gICAgdGhpcy5zdGFydCgpO1xuICB9XG5cbiAgY29ubmVjdGVkKCkge1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICByZXR1cm4gdGhpcy5waW5nZWRBdCA9IG5vdygpO1xuICB9XG5cbiAgcmVjZWl2ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMucGluZ2VkQXQgPSBub3coKTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHJldHVybiB0aGlzLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICBkZWxldGUgdGhpcy5zdG9wcGVkQXQ7XG4gICAgdGhpcy5zdGFydGVkQXQgPSBub3coKTtcbiAgICByZXR1cm4gdGhpcy5wb2xsKCk7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BwZWRBdCA9IG5vdygpO1xuICB9XG5cbiAgcG9sbCgpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFfdGhpcy5zdG9wcGVkQXQpIHtcbiAgICAgICAgICBfdGhpcy5yZWNvbm5lY3RJZlN0YWxlKCk7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLnBvbGwoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KSh0aGlzKSwgdGhpcy5nZXRJbnRlcnZhbCgpKTtcbiAgfVxuXG4gIGdldEludGVydmFsKCkge1xuICAgIHZhciBpbnRlcnZhbCwgbWF4LCBtaW4sIHJlZjtcbiAgICByZWYgPSB0aGlzLnBvbGxJbnRlcnZhbCwgbWluID0gcmVmLm1pbiwgbWF4ID0gcmVmLm1heDtcbiAgICBpbnRlcnZhbCA9IDQgKiBNYXRoLmxvZyh0aGlzLnJlY29ubmVjdEF0dGVtcHRzICsgMSk7XG4gICAgcmV0dXJuIGNsYW1wKGludGVydmFsLCBtaW4sIG1heCkgKiAxMDAwO1xuICB9XG5cbiAgcmVjb25uZWN0SWZTdGFsZSgpIHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uSXNTdGFsZSgpKSB7XG4gICAgICB0aGlzLnJlY29ubmVjdEF0dGVtcHRzICs9IDE7XG4gICAgICByZXR1cm4gdGhpcy5jb25zdW1lci5jb25uZWN0aW9uLnJlb3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIGNvbm5lY3Rpb25Jc1N0YWxlKCkge1xuICAgIGlmICh0aGlzLnBpbmdlZEF0KSB7XG4gICAgICByZXR1cm4gc2Vjb25kc1NpbmNlKHRoaXMucGluZ2VkQXQpID4gdGhpcy5zdGFsZVRocmVzaG9sZC5waW5nZWRBdDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNlY29uZHNTaW5jZSh0aGlzLnN0YXJ0ZWRBdCkgPiB0aGlzLnN0YWxlVGhyZXNob2xkLnN0YXJ0ZWRBdDtcbiAgICB9XG4gIH1cblxuICB0b0pTT04oKSB7XG4gICAgdmFyIGNvbm5lY3Rpb25Jc1N0YWxlLCBpbnRlcnZhbDtcbiAgICBpbnRlcnZhbCA9IHRoaXMuZ2V0SW50ZXJ2YWwoKTtcbiAgICBjb25uZWN0aW9uSXNTdGFsZSA9IHRoaXMuY29ubmVjdGlvbklzU3RhbGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhcnRlZEF0OiB0aGlzLnN0YXJ0ZWRBdCxcbiAgICAgIHN0b3BwZWRBdDogdGhpcy5zdG9wcGVkQXQsXG4gICAgICBwaW5nZWRBdDogdGhpcy5waW5nZWRBdCxcbiAgICAgIHJlY29ubmVjdEF0dGVtcHRzOiB0aGlzLnJlY29ubmVjdEF0dGVtcHRzLFxuICAgICAgY29ubmVjdGlvbklzU3RhbGU6IGNvbm5lY3Rpb25Jc1N0YWxlLFxuICAgICAgaW50ZXJ2YWw6IGludGVydmFsXG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb25uZWN0aW9uTW9uaXRvcjsiLCIvKlxuIyBUaGUgQ2FibGUuQ29uc3VtZXIgZXN0YWJsaXNoZXMgdGhlIGNvbm5lY3Rpb24gdG8gYSBzZXJ2ZXItc2lkZSBSdWJ5IENvbm5lY3Rpb24gb2JqZWN0LiBPbmNlIGVzdGFibGlzaGVkLFxuIyB0aGUgQ2FibGUuQ29ubmVjdGlvbk1vbml0b3Igd2lsbCBlbnN1cmUgdGhhdCBpdHMgcHJvcGVybHkgbWFpbnRhaW5lZCB0aHJvdWdoIGhlYXJ0YmVhdHMgYW5kIGNoZWNraW5nIGZvciBzdGFsZSB1cGRhdGVzLlxuIyBUaGUgQ29uc3VtZXIgaW5zdGFuY2UgaXMgYWxzbyB0aGUgZ2F0ZXdheSB0byBlc3RhYmxpc2hpbmcgc3Vic2NyaXB0aW9ucyB0byBkZXNpcmVkIGNoYW5uZWxzIHRocm91Z2ggdGhlICNjcmVhdGVTdWJzY3JpcHRpb25cbiMgbWV0aG9kLlxuI1xuIyBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRoaXMgY2FuIGJlIHNldHVwOlxuI1xuIyAgIEBBcHAgPSB7fVxuIyAgIEFwcC5jYWJsZSA9IENhYmxlLmNyZWF0ZUNvbnN1bWVyIFwid3M6Ly9leGFtcGxlLmNvbS9hY2NvdW50cy8xXCJcbiMgICBBcHAuYXBwZWFyYW5jZSA9IEFwcC5jYWJsZS5zdWJzY3JpcHRpb25zLmNyZWF0ZSBcIkFwcGVhcmFuY2VDaGFubmVsXCJcbiNcbiMgRm9yIG1vcmUgZGV0YWlscyBvbiBob3cgeW91J2QgY29uZmlndXJlIGFuIGFjdHVhbCBjaGFubmVsIHN1YnNjcmlwdGlvbiwgc2VlIENhYmxlLlN1YnNjcmlwdGlvbi5cbiovXG5pbXBvcnQgU3Vic2NyaXB0aW9uIGZyb20gJy4vU3Vic2NyaXB0aW9uJztcbmltcG9ydCBTdWJzY3JpcHRpb25zIGZyb20gJy4vU3Vic2NyaXB0aW9ucyc7XG5pbXBvcnQgQ29ubmVjdGlvbiBmcm9tICcuL0Nvbm5lY3Rpb24nO1xuaW1wb3J0IENvbm5lY3Rpb25Nb25pdG9yIGZyb20gJy4vQ29ubmVjdGlvbk1vbml0b3InO1xuXG5jbGFzcyBDb25zdW1lciB7XG4gIGNvbnN0cnVjdG9yKHVybCkge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBTdWJzY3JpcHRpb25zKHRoaXMpO1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKHRoaXMpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1vbml0b3IgPSBuZXcgQ29ubmVjdGlvbk1vbml0b3IodGhpcyk7XG4gIH1cbiAgc2VuZChkYXRhKSB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbi5zZW5kKGRhdGEpO1xuICB9XG4gIGluc3BlY3QoKSB7XG4gICAgSlNPTi5zdHJpbmdpZnkodGhpcywgbnVsbCwgMik7XG4gIH1cbiAgdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmw6IHRoaXMudXJsLFxuICAgICAgc3Vic2NyaXB0aW9uczogdGhpcy5zdWJzY3JpcHRpb25zLFxuICAgICAgY29ubmVjdGlvbjogdGhpcy5jb25uZWN0aW9uLFxuICAgICAgY29ubmVjdGlvbk1vbml0b3I6IHRoaXMuY29ubmVjdGlvbk1vbml0b3JcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbnN1bWVyOyIsIi8qXG4jIEEgbmV3IHN1YnNjcmlwdGlvbiBpcyBjcmVhdGVkIHRocm91Z2ggdGhlIENhYmxlLlN1YnNjcmlwdGlvbnMgaW5zdGFuY2UgYXZhaWxhYmxlIG9uIHRoZSBjb25zdW1lci4gXG4jIEl0IHByb3ZpZGVzIGEgbnVtYmVyIG9mIGNhbGxiYWNrcyBhbmQgYSBtZXRob2QgZm9yIGNhbGxpbmcgcmVtb3RlIHByb2NlZHVyZSBjYWxscyBvbiB0aGUgY29ycmVzcG9uZGluZyBcbiMgQ2hhbm5lbCBpbnN0YW5jZSBvbiB0aGUgc2VydmVyIHNpZGUuXG4jXG4jIEFuIGV4YW1wbGUgZGVtb25zdHJhdGVzIHRoZSBiYXNpYyBmdW5jdGlvbmFsaXR5OlxuI1xuIyAgIEFwcC5hcHBlYXJhbmNlID0gQXBwLmNhYmxlLnN1YnNjcmlwdGlvbnMuY3JlYXRlIFwiQXBwZWFyYW5jZUNoYW5uZWxcIixcbiMgICAgIGNvbm5lY3RlZDogLT5cbiMgICAgICAgIyBDYWxsZWQgb25jZSB0aGUgc3Vic2NyaXB0aW9uIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBjb21wbGV0ZWRcbiMgICBcbiMgICAgIGFwcGVhcjogLT5cbiMgICAgICAgQHBlcmZvcm0gJ2FwcGVhcicsIGFwcGVhcmluZ19vbjogQGFwcGVhcmluZ09uKClcbiMgICBcbiMgICAgIGF3YXk6IC0+XG4jICAgICAgIEBwZXJmb3JtICdhd2F5J1xuIyAgIFxuIyAgICAgYXBwZWFyaW5nT246IC0+XG4jICAgICAgICQoJ21haW4nKS5kYXRhICdhcHBlYXJpbmctb24nXG4jXG4jIFRoZSBtZXRob2RzICNhcHBlYXIgYW5kICNhd2F5IGZvcndhcmQgdGhlaXIgaW50ZW50IHRvIHRoZSByZW1vdGUgQXBwZWFyYW5jZUNoYW5uZWwgaW5zdGFuY2Ugb24gdGhlIHNlcnZlclxuIyBieSBjYWxsaW5nIHRoZSBgQHBlcmZvcm1gIG1ldGhvZCB3aXRoIHRoZSBmaXJzdCBwYXJhbWV0ZXIgYmVpbmcgdGhlIGFjdGlvbiAod2hpY2ggbWFwcyB0byBBcHBlYXJhbmNlQ2hhbm5lbCNhcHBlYXIvYXdheSkuXG4jIFRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGEgaGFzaCB0aGF0J2xsIGdldCBKU09OIGVuY29kZWQgYW5kIG1hZGUgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXIgaW4gdGhlIGRhdGEgcGFyYW1ldGVyLlxuI1xuIyBUaGlzIGlzIGhvdyB0aGUgc2VydmVyIGNvbXBvbmVudCB3b3VsZCBsb29rOlxuI1xuIyAgIGNsYXNzIEFwcGVhcmFuY2VDaGFubmVsIDwgQXBwbGljYXRpb25DYWJsZTo6Q2hhbm5lbFxuIyAgICAgZGVmIHN1YnNjcmliZWRcbiMgICAgICAgY3VycmVudF91c2VyLmFwcGVhclxuIyAgICAgZW5kXG4jICAgXG4jICAgICBkZWYgdW5zdWJzY3JpYmVkXG4jICAgICAgIGN1cnJlbnRfdXNlci5kaXNhcHBlYXJcbiMgICAgIGVuZFxuIyAgIFxuIyAgICAgZGVmIGFwcGVhcihkYXRhKVxuIyAgICAgICBjdXJyZW50X3VzZXIuYXBwZWFyIG9uOiBkYXRhWydhcHBlYXJpbmdfb24nXVxuIyAgICAgZW5kXG4jICAgXG4jICAgICBkZWYgYXdheVxuIyAgICAgICBjdXJyZW50X3VzZXIuYXdheVxuIyAgICAgZW5kXG4jICAgZW5kXG4jXG4jIFRoZSBcIkFwcGVhcmFuY2VDaGFubmVsXCIgbmFtZSBpcyBhdXRvbWF0aWNhbGx5IG1hcHBlZCBiZXR3ZWVuIHRoZSBjbGllbnQtc2lkZSBzdWJzY3JpcHRpb24gY3JlYXRpb24gYW5kIHRoZSBzZXJ2ZXItc2lkZSBSdWJ5IGNsYXNzIG5hbWUuXG4jIFRoZSBBcHBlYXJhbmNlQ2hhbm5lbCNhcHBlYXIvYXdheSBwdWJsaWMgbWV0aG9kcyBhcmUgZXhwb3NlZCBhdXRvbWF0aWNhbGx5IHRvIGNsaWVudC1zaWRlIGludm9jYXRpb24gdGhyb3VnaCB0aGUgQHBlcmZvcm0gbWV0aG9kLlxuKi9cblxudmFyIGV4dGVuZCA9IChvYmplY3QsIHByb3BlcnRpZXMpID0+IHtcbiAgdmFyIGtleSwgdmFsdWU7XG4gIGlmIChwcm9wZXJ0aWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGtleSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICB2YWx1ZSA9IHByb3BlcnRpZXNba2V5XTtcbiAgICAgIG9iamVjdFtrZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmplY3Q7XG59O1xuXG5jbGFzcyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3RvcihzdWJzY3JpcHRpb25zLCBwYXJhbXMsIG1peGluKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gc3Vic2NyaXB0aW9ucztcbiAgICBpZiAocGFyYW1zID09IG51bGwpIHtcbiAgICAgIHBhcmFtcyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLmlkZW50aWZpZXIgPSBKU09OLnN0cmluZ2lmeShwYXJhbXMpO1xuICAgIGV4dGVuZCh0aGlzLCBtaXhpbik7XG4gICAgdGhpcy5jb25zdW1lciA9IHRoaXMuc3Vic2NyaXB0aW9ucy5jb25zdW1lcjtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMpO1xuICB9XG5cbiAgcGVyZm9ybShhY3Rpb24sIGRhdGEpIHtcbiAgICBpZiAoZGF0YSA9PSBudWxsKSB7XG4gICAgICBkYXRhID0ge307XG4gICAgfVxuICAgIGRhdGEuYWN0aW9uID0gYWN0aW9uO1xuICAgIHJldHVybiB0aGlzLnNlbmQoZGF0YSk7XG4gIH1cblxuICBzZW5kKGRhdGEpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdW1lci5zZW5kKHtcbiAgICAgIGNvbW1hbmQ6IFwibWVzc2FnZVwiLFxuICAgICAgaWRlbnRpZmllcjogdGhpcy5pZGVudGlmaWVyLFxuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICB9KTtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlKCkge1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHRoaXMpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFN1YnNjcmlwdGlvbjsiLCIvKlxuIyBDb2xsZWN0aW9uIGNsYXNzIGZvciBjcmVhdGluZyAoYW5kIGludGVybmFsbHkgbWFuYWdpbmcpIGNoYW5uZWwgc3Vic2NyaXB0aW9ucy4gVGhlIG9ubHkgbWV0aG9kIGludGVuZGVkIHRvIGJlIHRyaWdnZXJlZCBieSB0aGUgdXNlclxuIyB1cyBDYWJsZS5TdWJzY3JpcHRpb25zI2NyZWF0ZSwgYW5kIGl0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaCB0aGUgY29uc3VtZXIgbGlrZSBzbzpcbiNcbiMgICBAQXBwID0ge31cbiMgICBBcHAuY2FibGUgPSBDYWJsZS5jcmVhdGVDb25zdW1lciBcIndzOi8vZXhhbXBsZS5jb20vYWNjb3VudHMvMVwiXG4jICAgQXBwLmFwcGVhcmFuY2UgPSBBcHAuY2FibGUuc3Vic2NyaXB0aW9ucy5jcmVhdGUgXCJBcHBlYXJhbmNlQ2hhbm5lbFwiXG4jXG4jIEZvciBtb3JlIGRldGFpbHMgb24gaG93IHlvdSdkIGNvbmZpZ3VyZSBhbiBhY3R1YWwgY2hhbm5lbCBzdWJzY3JpcHRpb24sIHNlZSBDYWJsZS5TdWJzY3JpcHRpb24uXG4qL1xuXG5pbXBvcnQgU3Vic2NyaXB0aW9uIGZyb20gJy4vU3Vic2NyaXB0aW9uJztcbmltcG9ydCBDYWJsZSBmcm9tICcuLi9DYWJsZSc7XG5cbnZhciBzbGljZSA9IFtdLnNsaWNlO1xuXG5jbGFzcyBTdWJzY3JpcHRpb25zIHtcbiAgY29uc3RydWN0b3IoY29uc3VtZXIpIHtcbiAgICB0aGlzLmNvbnN1bWVyID0gY29uc3VtZXI7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gW107XG4gIH1cblxuICBjcmVhdGUoY2hhbm5lbE5hbWUsIG1peGluKSB7XG4gICAgdmFyIGNoYW5uZWwsIHBhcmFtcztcbiAgICBjaGFubmVsID0gY2hhbm5lbE5hbWU7XG4gICAgcGFyYW1zID0gdHlwZW9mIGNoYW5uZWwgPT09IFwib2JqZWN0XCIgPyBjaGFubmVsIDoge1xuICAgICAgY2hhbm5lbDogY2hhbm5lbFxuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTdWJzY3JpcHRpb24odGhpcywgcGFyYW1zLCBtaXhpbik7XG4gIH1cblxuICBhZGQoc3Vic2NyaXB0aW9uKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vic2NyaXB0aW9uKTtcbiAgICB0aGlzLm5vdGlmeShzdWJzY3JpcHRpb24sIFwiaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKHRoaXMuc2VuZENvbW1hbmQoc3Vic2NyaXB0aW9uLCBcInN1YnNjcmliZVwiKSkge1xuICAgICAgcmV0dXJuIHRoaXMubm90aWZ5KHN1YnNjcmlwdGlvbiwgXCJjb25uZWN0ZWRcIik7XG4gICAgfVxuICB9XG5cbiAgcmVsb2FkKCkge1xuICAgIHZhciBpLCBsZW4sIHJlZiwgcmVzdWx0cywgc3Vic2NyaXB0aW9uO1xuICAgIHJlZiA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBzdWJzY3JpcHRpb24gPSByZWZbaV07XG4gICAgICBpZiAodGhpcy5zZW5kQ29tbWFuZChzdWJzY3JpcHRpb24sIFwic3Vic2NyaWJlXCIpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLm5vdGlmeShzdWJzY3JpcHRpb24sIFwiY29ubmVjdGVkXCIpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIHJlbW92ZShzdWJzY3JpcHRpb24pIHtcbiAgICB2YXIgcztcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgbGVuLCByZWYsIHJlc3VsdHM7XG4gICAgICByZWYgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcyA9IHJlZltpXTtcbiAgICAgICAgaWYgKHMgIT09IHN1YnNjcmlwdGlvbikge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfSkuY2FsbCh0aGlzKTtcbiAgICBpZiAoIXRoaXMuZmluZEFsbChzdWJzY3JpcHRpb24uaWRlbnRpZmllcikubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kQ29tbWFuZChzdWJzY3JpcHRpb24sIFwidW5zdWJzY3JpYmVcIik7XG4gICAgfVxuICB9XG5cbiAgZmluZEFsbChpZGVudGlmaWVyKSB7XG4gICAgdmFyIGksIGxlbiwgcmVmLCByZXN1bHRzLCBzO1xuICAgIHJlZiA9IHRoaXMuc3Vic2NyaXB0aW9ucztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBzID0gcmVmW2ldO1xuICAgICAgaWYgKHMuaWRlbnRpZmllciA9PT0gaWRlbnRpZmllcikge1xuICAgICAgICByZXN1bHRzLnB1c2gocyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgbm90aWZ5QWxsKCkge1xuICAgIHZhciBhcmdzLCBjYWxsYmFja05hbWUsIGksIGxlbiwgcmVmLCByZXN1bHRzLCBzdWJzY3JpcHRpb247XG4gICAgY2FsbGJhY2tOYW1lID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpIDogW107XG4gICAgcmVmID0gdGhpcy5zdWJzY3JpcHRpb25zO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHN1YnNjcmlwdGlvbiA9IHJlZltpXTtcbiAgICAgIHJlc3VsdHMucHVzaCh0aGlzLm5vdGlmeS5hcHBseSh0aGlzLCBbc3Vic2NyaXB0aW9uLCBjYWxsYmFja05hbWVdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3MpKSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIG5vdGlmeSgpIHtcbiAgICB2YXIgYXJncywgY2FsbGJhY2tOYW1lLCBpLCBsZW4sIHJlc3VsdHMsIHN1YnNjcmlwdGlvbiwgc3Vic2NyaXB0aW9ucztcbiAgICBzdWJzY3JpcHRpb24gPSBhcmd1bWVudHNbMF0sIGNhbGxiYWNrTmFtZSA9IGFyZ3VtZW50c1sxXSwgYXJncyA9IDMgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IFtdO1xuICAgIGlmICh0eXBlb2Ygc3Vic2NyaXB0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBzdWJzY3JpcHRpb25zID0gdGhpcy5maW5kQWxsKHN1YnNjcmlwdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1YnNjcmlwdGlvbnMgPSBbc3Vic2NyaXB0aW9uXTtcbiAgICB9XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbnNbaV07XG4gICAgICByZXN1bHRzLnB1c2godHlwZW9mIHN1YnNjcmlwdGlvbltjYWxsYmFja05hbWVdID09PSBcImZ1bmN0aW9uXCIgPyBzdWJzY3JpcHRpb25bY2FsbGJhY2tOYW1lXS5hcHBseShzdWJzY3JpcHRpb24sIGFyZ3MpIDogdm9pZCAwKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICBzZW5kQ29tbWFuZChzdWJzY3JpcHRpb24sIGNvbW1hbmQpIHtcbiAgICB2YXIgaWRlbnRpZmllcjtcbiAgICBpZGVudGlmaWVyID0gc3Vic2NyaXB0aW9uLmlkZW50aWZpZXI7XG4gICAgaWYgKGlkZW50aWZpZXIgPT09IENhYmxlLlBJTkdfSURFTlRJRklFUikge1xuICAgICAgcmV0dXJuIHRoaXMuY29uc3VtZXIuY29ubmVjdGlvbi5pc09wZW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY29uc3VtZXIuc2VuZCh7XG4gICAgICAgIGNvbW1hbmQ6IGNvbW1hbmQsXG4gICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXJcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICB2YXIgaSwgbGVuLCByZWYsIHJlc3VsdHMsIHN1YnNjcmlwdGlvbjtcbiAgICByZWYgPSB0aGlzLnN1YnNjcmlwdGlvbnM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgc3Vic2NyaXB0aW9uID0gcmVmW2ldO1xuICAgICAgcmVzdWx0cy5wdXNoKHN1YnNjcmlwdGlvbi5pZGVudGlmaWVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBTdWJzY3JpcHRpb25zOyJdfQ==
