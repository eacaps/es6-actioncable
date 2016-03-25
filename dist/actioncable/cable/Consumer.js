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
  function Consumer(url, options) {
    _classCallCheck(this, Consumer);

    this.url = url;

    if (!options) {
      options = {};
    }
    this.url = url;
    this.protocols = options.protocols;
    this.origin = options.origin;
    this.headers = options.headers;
    this.extraRequestOptions = options.extraRequestOptions;

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