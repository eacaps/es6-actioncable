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