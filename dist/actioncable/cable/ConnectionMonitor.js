"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # Responsible for ensuring the cable connection is in good health by validating the heartbeat pings sent from the server, and attempting
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # revival reconnections if things go astray. Internal class, not intended for direct user manipulation.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _Logger = require("../Logger");

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var now = function now() {
  return new Date().getTime();
};

var secondsSince = function secondsSince(time) {
  return (now() - time) / 1000;
};

var clamp = function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
};

var ConnectionMonitor = function () {
  function ConnectionMonitor(consumer) {
    _classCallCheck(this, ConnectionMonitor);

    this.pollInterval = {
      min: 3,
      max: 30
    };
    this.staleThreshold = 6;
    this.consumer = consumer;
    this.visibilityDidChange = this._visibilityDidChange.bind(this);
    this.start();
  }

  _createClass(ConnectionMonitor, [{
    key: "connected",
    value: function connected() {
      this.reset();
      this.pingedAt = now();
      delete this.disconnectedAt;
      return _Logger2.default.log("ConnectionMonitor connected");
    }
  }, {
    key: "disconnected",
    value: function disconnected() {
      this.disconnectedAt = now();
      return _Logger2.default.log("ConnectionMonitor disconnected");
    }
  }, {
    key: "ping",
    value: function ping() {
      return this.pingedAt = now();
    }
  }, {
    key: "reset",
    value: function reset() {
      this.reconnectAttempts = 0;
      return this.consumer.connection.isOpen();
    }
  }, {
    key: "start",
    value: function start() {
      this.reset();
      delete this.stoppedAt;
      this.startedAt = now();
      this.poll();
      document.addEventListener("visibilitychange", this.visibilityDidChange);
      return _Logger2.default.log("ConnectionMonitor started, pollInterval is " + this.getInterval() + "ms");
    }
  }, {
    key: "stop",
    value: function stop() {
      this.stoppedAt = now();
      document.removeEventListener("visibilitychange", this.visibilityDidChange);
      return _Logger2.default.log("ConnectionMonitor stopped");
    }
  }, {
    key: "poll",
    value: function poll() {
      return setTimeout(function (_this) {
        return function () {
          if (!_this.stoppedAt) {
            _this.reconnectIfStale();
            return _this.poll();
          }
        };
      }(this), this.getInterval());
    }
  }, {
    key: "getInterval",
    value: function getInterval() {
      var interval, max, min, ref;
      ref = this.constructor.pollInterval, min = ref.min, max = ref.max;
      interval = 5 * Math.log(this.reconnectAttempts + 1);
      return clamp(interval, min, max) * 1000;
    }
  }, {
    key: "reconnectIfStale",
    value: function reconnectIfStale() {
      if (this.connectionIsStale()) {
        _Logger2.default.log("ConnectionMonitor detected stale connection, reconnectAttempts = " + this.reconnectAttempts);
        this.reconnectAttempts++;
        if (this.disconnectedRecently()) {
          return _Logger2.default.log("ConnectionMonitor skipping reopen because recently disconnected at " + this.disconnectedAt);
        } else {
          _Logger2.default.log("ConnectionMonitor reopening");
          return this.consumer.connection.reopen();
        }
      }
    }
  }, {
    key: "connectionIsStale",
    value: function connectionIsStale() {
      var ref;
      return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.staleThreshold;
    }
  }, {
    key: "disconnectedRecently",
    value: function disconnectedRecently() {
      return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
    }
  }, {
    key: "visibilityDidChange",
    value: function visibilityDidChange() {
      if (document.visibilityState === "visible") {
        return setTimeout(function (_this) {
          return function () {
            if (_this.connectionIsStale() || !_this.consumer.connection.isOpen()) {
              _Logger2.default.log("ConnectionMonitor reopening stale connection after visibilitychange to " + document.visibilityState);
              return _this.consumer.connection.reopen();
            }
          };
        }(this), 200);
      }
    }
  }, {
    key: "toJSON",
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
}();

exports.default = ConnectionMonitor;