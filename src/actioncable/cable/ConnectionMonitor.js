/*
# Responsible for ensuring the cable connection is in good health by validating
  the heartbeat pings sent from the server, and attempting
# revival reconnections if things go astray. Internal class, not intended for
  direct user manipulation.
*/
import ActionCable from '../Logger';

const now = () => (
  new Date().getTime()
);

const secondsSince = time => (
  (now() - time) / 1000
);

const clamp = (number, min, max) => (
  Math.max(min, Math.min(max, number))
);

class ConnectionMonitor {
  constructor(consumer) {
    this.pollInterval = {
      min: 3,
      max: 30,
    };
    this.staleThreshold = 6;
    this.consumer = consumer;
    this.visibilityDidChange = this.visibilityDidChange.bind(this);
    this.start();
  }

  connected() {
    this.reset();
    this.pingedAt = now();
    delete this.disconnectedAt;
    return ActionCable.log('ConnectionMonitor connected');
  }

  disconnected() {
    this.disconnectedAt = now();
    return ActionCable.log('ConnectionMonitor disconnected');
  }

  ping() {
    this.pingedAt = now();
    return this.pinedAt;
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
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityDidChange);
    }

    return ActionCable.log(
      `ConnectionMonitor started, pollInterval is ${this.getInterval()}ms`);
  }

  stop() {
    this.stoppedAt = now();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange',
        this.visibilityDidChange);
    }

    return ActionCable.log('ConnectionMonitor stopped');
  }

  poll() {
    return setTimeout((that => (
      () => {
        if (!that.stoppedAt) {
          that.reconnectIfStale();
          return that.poll();
        }
        return true;
      }
    ))(this), this.getInterval());
  }

  getInterval() {
    const ref = this.pollInterval;
    const min = ref.min;
    const max = ref.max;
    const interval = 5 * Math.log(this.reconnectAttempts + 1);
    return clamp(interval, min, max) * 1000;
  }

  reconnectIfStale() {
    if (this.connectionIsStale()) {
      ActionCable.log(
        `ConnectionMonitor detected stale connection, reconnectAttempts = ${this.reconnectAttempts}`);
      this.reconnectAttempts += 1;
      if (this.disconnectedRecently()) {
        return ActionCable.log(
          `ConnectionMonitor skipping reopen because recently disconnected at ${this.disconnectedAt}`);
      }
      ActionCable.log('ConnectionMonitor reopening');
      return this.consumer.connection.reopen();
    }
    return true;
  }

  connectionIsStale() {
    const pingedAt = this.pingedAt !== null ? this.pingedAt : this.startedAt;
    return pingedAt > this.stateThreshold;
  }

  disconnectedRecently() {
    return this.disconnectedAt && secondsSince(this.disconnectedAt) <
      this.staleThreshold;
  }

  visibilityDidChange() {
    if (document.visibilityState === 'visible') {
      return setTimeout((that => (
        () => {
          if (that.connectionIsStale() ||
            !that.consumer.connection.isOpen()) {
            ActionCable.log(
              `ConnectionMonitor reopening stale connection after visibilitychange to ${document.visibilityState}`);
            return that.consumer.connection.reopen();
          }
          return true;
        }
      ))(this), 200);
    }
    return true;
  }

  toJSON() {
    const interval = this.getInterval();
    const connectionIsStale = this.connectionIsStale();
    return {
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      pingedAt: this.pingedAt,
      reconnectAttempts: this.reconnectAttempts,
      connectionIsStale,
      interval,
    };
  }
}

export default ConnectionMonitor;
