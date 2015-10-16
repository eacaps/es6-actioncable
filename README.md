# es6-actioncable
This module is a ort of the actioncable coffeescript code to ES6 and nodized it. For more info on actioncable, check out their github page - https://github.com/rails/actioncable.

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
        let _this = this;
        this.subscription = ForumWebSocket.getConsumer().subscriptions.create("MyChannel", {
          connected: function () {
            console.log('connected to linkssubscription');
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