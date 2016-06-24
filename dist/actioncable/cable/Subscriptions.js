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
        if (subscription) {
          results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
        }
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