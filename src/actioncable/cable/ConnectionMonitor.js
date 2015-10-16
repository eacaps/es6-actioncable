/*
# Responsible for ensuring the cable connection is in good health by validating the heartbeat pings sent from the server, and attempting
# revival reconnections if things go astray. Internal class, not intended for direct user manipulation.
*/
import Cable from '../Cable';

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
      min: 2,
      max: 30
    };
    this.staleThreshold = {
      startedAt: 4,
      pingedAt: 8
    };
    this.identifier = Cable.PING_IDENTIFIER;
    this.consumer = consumer;
    this.consumer.subscriptions.add(this);
    this.start();
  }

  connected() {
    this.reset();
    return this.pingedAt = now();
  }

  received() {
    return this.pingedAt = now();
  }

  reset() {
    return this.reconnectAttempts = 0;
  }

  start() {
    this.reset();
    delete this.stoppedAt;
    this.startedAt = now();
    return this.poll();
  }

  stop() {
    return this.stoppedAt = now();
  }

  poll() {
    return setTimeout((function(_this) {
      return function() {
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
    interval = 4 * Math.log(this.reconnectAttempts + 1);
    return clamp(interval, min, max) * 1000;
  }

  reconnectIfStale() {
    if (this.connectionIsStale()) {
      this.reconnectAttempts += 1;
      return this.consumer.connection.reopen();
    }
  }

  connectionIsStale() {
    if (this.pingedAt) {
      return secondsSince(this.pingedAt) > this.staleThreshold.pingedAt;
    } else {
      return secondsSince(this.startedAt) > this.staleThreshold.startedAt;
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