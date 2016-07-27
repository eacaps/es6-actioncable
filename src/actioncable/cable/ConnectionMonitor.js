/*
# Responsible for ensuring the cable connection is in good health by validating the heartbeat pings sent from the server, and attempting
# revival reconnections if things go astray. Internal class, not intended for direct user manipulation.
*/
import ActionCable from '../Logger';

var now = () => {
  return new Date().getTime();
};

var secondsSince = (time) => {
  return (now() - time) / 1000;
};

var clamp = (number, min, max) => {
  return Math.max(min, Math.min(max, number));
};

class ConnectionMonitor {

  constructor(consumer) {
    this.pollInterval = {
      min: 3,
      max: 30
    };
    this.staleThreshold = 6;
    this.consumer = consumer;
    this.visibilityDidChange = this._visibilityDidChange.bind(this);
    this.start();
  }

  connected() {
    this.reset();
    this.pingedAt = now();
    delete this.disconnectedAt;
    return ActionCable.log("ConnectionMonitor connected");
  }

  disconnected() {
    this.disconnectedAt = now();
    return ActionCable.log("ConnectionMonitor disconnected");
  }

  ping() {
    return this.pingedAt = now();
  }

  reset() {
    this.reconnectAttempts = 0;
    return this.consumer.connection.isOpen();
  }

  start() {
    this.reset();
    delete this.stoppedAt;
    this.startedAt = now();
    this.poll();
    document.addEventListener("visibilitychange", this.visibilityDidChange);
    return ActionCable.log("ConnectionMonitor started, pollInterval is " + (this.getInterval()) + "ms");
  }

  stop() {
    this.stoppedAt = now();
    document.removeEventListener("visibilitychange", this.visibilityDidChange);
    return ActionCable.log("ConnectionMonitor stopped");
  }

  poll() {
    return setTimeout(((_this) => {
      return () => {
        if (!_this.stoppedAt) {
          _this.reconnectIfStale();
          return _this.poll();
        }
      };
    })(this), this.getInterval());
  }

  getInterval() {
    var interval, max, min, ref;
    ref = this.pollInterval, min = ref.min, max = ref.max;
    interval = 5 * Math.log(this.reconnectAttempts + 1);
    return clamp(interval, min, max) * 1000;
  }

  reconnectIfStale() {
    if (this.connectionIsStale()) {
      ActionCable.log("ConnectionMonitor detected stale connection, reconnectAttempts = " + this.reconnectAttempts);
      this.reconnectAttempts++;
      if (this.disconnectedRecently()) {
        return ActionCable.log("ConnectionMonitor skipping reopen because recently disconnected at " + this.disconnectedAt);
      } else {
        ActionCable.log("ConnectionMonitor reopening");
        return this.consumer.connection.reopen();
      }
    }
  }

  connectionIsStale() {
    var ref;
    return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.staleThreshold;
  }

  disconnectedRecently() {
    return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.staleThreshold;
  }

  _visibilityDidChange() {
    if (document.visibilityState === "visible") {
      return setTimeout(((_this) => {
        return () => {
          if (_this.connectionIsStale() || !_this.consumer.connection.isOpen()) {
            ActionCable.log("ConnectionMonitor reopening stale connection after visibilitychange to " + document.visibilityState);
            return _this.consumer.connection.reopen();
          }
        };
      })(this), 200);
    }
  }

  toJSON() {
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
}

export default ConnectionMonitor;
