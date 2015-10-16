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

import Subscription from './Subscription';
import Cable from '../Cable';

var slice = [].slice;

class Subscriptions {
  constructor(consumer) {
    this.consumer = consumer;
    this.subscriptions = [];
  }

  create(channelName, mixin) {
    var channel, params;
    channel = channelName;
    params = typeof channel === "object" ? channel : {
      channel: channel
    };
    return new Subscription(this, params, mixin);
  }

  add(subscription) {
    this.subscriptions.push(subscription);
    this.notify(subscription, "initialized");
    if (this.sendCommand(subscription, "subscribe")) {
      return this.notify(subscription, "connected");
    }
  }

  reload() {
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

  remove(subscription) {
    var s;
    this.subscriptions = (function() {
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

  findAll(identifier) {
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

  notifyAll() {
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

  notify() {
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

  sendCommand(subscription, command) {
    var identifier;
    identifier = subscription.identifier;
    if (identifier === Cable.PING_IDENTIFIER) {
      return this.consumer.connection.isOpen();
    } else {
      return this.consumer.send({
        command: command,
        identifier: identifier
      });
    }
  }

  toJSON() {
    var i, len, ref, results, subscription;
    ref = this.subscriptions;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      subscription = ref[i];
      results.push(subscription.identifier);
    }
    return results;
  }

}

export default Subscriptions;