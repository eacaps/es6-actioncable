/*
# Collection class for creating (and internally managing) channel subscriptions.
The only method intended to be triggered by the user
# us Cable.Subscriptions#create, and it should be called through the consumer like so:
#
#   @App = {}
#   App.cable = Cable.createConsumer "ws://example.com/accounts/1"
#   App.appearance = App.cable.subscriptions.create "AppearanceChannel"
#
# For more details on how you'd configure an actual channel subscription, see Cable.Subscription.
*/
import Subscription from './Subscription';

const slice = [].slice;

class Subscriptions {
  constructor(consumer) {
    this.consumer = consumer;
    this.subscriptions = [];
  }

  create(channelName, mixin) {
    const channel = channelName;
    const params = typeof channel === 'object' ? channel : {
      channel,
    };
    return new Subscription(this, params, mixin);
  }

  add(subscription) {
    this.subscriptions.push(subscription);
    this.notify(subscription, 'initialized');
    return this.sendCommand(subscription, 'subscribe');
  }

  remove(subscription) {
    this.forget(subscription);
    if (!this.findAll(subscription.identifier).length) {
      return this.sendCommand(subscription, 'unsubscribe');
    }
    return true;
  }

  reject(identifier) {
    let i = 0;
    let len;
    let subscription;
    const ref = this.findAll(identifier);
    const results = [];
    for (len = ref.length; i < len; i += 1) {
      subscription = ref[i];
      this.forget(subscription);
      results.push(this.notify(subscription, 'rejected'));
    }
    return results;
  }

  forget(subscription) {
    let s;
    this.subscriptions = (() => {
      let i;
      let len;
      const ref = this.subscriptions;
      const results = [];
      for (i = 0, len = ref.length; i < len; i += 1) {
        s = ref[i];
        if (s !== subscription) {
          results.push(s);
        }
      }
      return results;
    }).call(this);
  }

  reload() {
    let i;
    let len;
    let subscription;
    const ref = this.subscriptions;
    const results = [];
    for (i = 0, len = ref.length; i < len; i += 1) {
      subscription = ref[i];
      results.push(this.sendCommand(subscription, 'subscribe'));
    }
    return results;
  }

  findAll(identifier) {
    let i;
    let len;
    let s;
    const ref = this.subscriptions;
    const results = [];
    for (i = 0, len = ref.length; i < len; i += 1) {
      s = ref[i];
      if (s.identifier === identifier) {
        results.push(s);
      }
    }
    return results;
  }

  notifyAll(...args) {
    let i;
    let len;
    let subscription;
    const callbackName = args[0];
    const formattedArgs = args.length <= 2 ?
      slice.call(args, 1) :
      [];
    const ref = this.subscriptions;
    const results = [];
    for (i = 0, len = ref.length; i < len; i += 1) {
      subscription = ref[i];
      results.push(
        this.notify(...[subscription, callbackName].concat(slice.call(formattedArgs))));
    }
    return results;
  }

  notify(...args) {
    let subscription = args[0];
    const callbackName = args[1];
    let i;
    let len;

    let subscriptions;
    const formattedArgs = args.length <= 3
      ? slice.call(args, 2) : [];
    if (typeof subscription === 'string') {
      subscriptions = this.findAll(subscription);
    } else {
      subscriptions = [subscription];
    }
    const results = [];
    for (i = 0, len = subscriptions.length; i < len; i += 1) {
      subscription = subscriptions[i];
      results.push(typeof subscription[callbackName] === 'function' ?
        subscription[callbackName](...formattedArgs) :
        0);
    }
    return results;
  }

  sendCommand(subscription, command) {
    const identifier = subscription.identifier;
    return this.consumer.send({
      command,
      identifier,
    });
  }

  toJSON() {
    let i;
    let len;
    let subscription;
    const ref = this.subscriptions;
    const results = [];
    for (i = 0, len = ref.length; i < len; i += 1) {
      subscription = ref[i];
      results.push(subscription.identifier);
    }
    return results;
  }

}

export default Subscriptions;
