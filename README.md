git st# es6-actioncable
This module is a port of the rails/actioncable coffeescript code to ES6 and nodized it. For more info on actioncable, check out their github page - https://github.com/rails/actioncable.

## Usage
Here is a sample of what I have in my application.

Websocket.js

    import Cable from 'es6-actioncable';

    class Websocket {
      constructor() {
      }

      connect() {
        console.log('connecting websocket');
        this.consumer = Cable.createConsumer(WEBSOCKET_URL);
      }

      getConsumer() {
        if(!this.consumer) {
          this.connect();
        }
        return this.consumer;
      }

      closeConnection() {
        if(this.consumer) {
          Cable.endConsumer(this.consumer);
        }
        delete this.consumer;
      }
    }

MyChannel.js

    import WebSocket from './websocket';

    class MyChannel {
      constructor() {
      }
      subscribe() {
        this.subscription = WebSocket.getConsumer().subscriptions.create("MyChannel", {
          connected: function () {
            console.log('connected to mychannel');
          },
          received: function (data) {
            //do stuff with data
          }
        });
      }
      unsubscribe() {
        if(this.subscription)
          this.subscription.unsubscribe();
      }
    }

Actioncable is good stuff, even if it is in Ruby.

## Connecting from Node.js

`es6-actioncable` will work under Node.js, however you will need to bear the following in mind:

* You will need to supply your own websocket library, 2 out of 2 developers recommend: https://www.npmjs.com/package/websocket.
* Your ActionCable Rails server must be bound to a specific IP or `0.0.0.0`, but not localhost. This can be done as follows `rails server -b 0.0.0.0`. See https://twitter.com/mattheworiordan/status/713350750483693568 for an explanation of the issue.
* You will need to pass the origin to the WebSocket library as Rails will by default reject requests with an invalid origin.  See example below:

```javascript
const consumer = Cable.createConsumer('ws://0.0.0.0:3000/cable', { createWebsocket: (options) => {
  var w3cwebsocket = require('websocket').w3cwebsocket;
  let webSocket = new w3cwebsocket(
     'ws://0.0.0.0:3000/cable',
     options.protocols,
     'http://0.0.0.0:3000',
     options.headers,
     options.extraRequestOptions
   );
   return webSocket;
} });
```
