"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
# A new subscription is created through the Cable.Subscriptions instance available on the consumer. 
# It provides a number of callbacks and a method for calling remote procedure calls on the corresponding 
# Channel instance on the server side.
#
# An example demonstrates the basic functionality:
#
#   App.appearance = App.cable.subscriptions.create "AppearanceChannel",
#     connected: ->
#       # Called once the subscription has been successfully completed
#   
#     appear: ->
#       @perform 'appear', appearing_on: @appearingOn()
#   
#     away: ->
#       @perform 'away'
#   
#     appearingOn: ->
#       $('main').data 'appearing-on'
#
# The methods #appear and #away forward their intent to the remote AppearanceChannel instance on the server
# by calling the `@perform` method with the first parameter being the action (which maps to AppearanceChannel#appear/away).
# The second parameter is a hash that'll get JSON encoded and made available on the server in the data parameter.
#
# This is how the server component would look:
#
#   class AppearanceChannel < ApplicationCable::Channel
#     def subscribed
#       current_user.appear
#     end
#   
#     def unsubscribed
#       current_user.disappear
#     end
#   
#     def appear(data)
#       current_user.appear on: data['appearing_on']
#     end
#   
#     def away
#       current_user.away
#     end
#   end
#
# The "AppearanceChannel" name is automatically mapped between the client-side subscription creation and the server-side Ruby class name.
# The AppearanceChannel#appear/away public methods are exposed automatically to client-side invocation through the @perform method.
*/

var extend = function extend(object, properties) {
  var key, value;
  if (properties != null) {
    for (key in properties) {
      value = properties[key];
      object[key] = value;
    }
  }
  return object;
};

var Subscription = function () {
  function Subscription(subscriptions, params, mixin) {
    _classCallCheck(this, Subscription);

    this.subscriptions = subscriptions;
    if (params == null) {
      params = {};
    }
    this.identifier = JSON.stringify(params);
    extend(this, mixin);
    this.consumer = this.subscriptions.consumer;
    this.subscriptions.add(this);
  }

  _createClass(Subscription, [{
    key: "perform",
    value: function perform(action, data) {
      if (data == null) {
        data = {};
      }
      data.action = action;
      return this.send(data);
    }
  }, {
    key: "send",
    value: function send(data) {
      return this.consumer.send({
        command: "message",
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    }
  }, {
    key: "unsubscribe",
    value: function unsubscribe() {
      return this.subscriptions.remove(this);
    }
  }]);

  return Subscription;
}();

exports.default = Subscription;