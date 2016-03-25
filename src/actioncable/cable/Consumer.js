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
import Subscription from './Subscription';
import Subscriptions from './Subscriptions';
import Connection from './Connection';
import ConnectionMonitor from './ConnectionMonitor';

class Consumer {
  constructor(url, options) {
    this.url = url;

    if (!options) { options = {}; }
    this.url = url;
    this.protocols = options.protocols;
    this.origin = options.origin;
    this.headers = options.headers;
    this.extraRequestOptions = options.extraRequestOptions;

    this.subscriptions = new Subscriptions(this);
    this.connection = new Connection(this);
    this.connectionMonitor = new ConnectionMonitor(this);
  }
  send(data) {
    return this.connection.send(data);
  }
  inspect() {
    JSON.stringify(this, null, 2);
  }
  toJSON() {
    return {
      url: this.url,
      subscriptions: this.subscriptions,
      connection: this.connection,
      connectionMonitor: this.connectionMonitor
    };
  }
}

export default Consumer;
