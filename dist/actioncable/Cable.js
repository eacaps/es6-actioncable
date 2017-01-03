"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Consumer = require("./cable/Consumer");

var _Consumer2 = _interopRequireDefault(_Consumer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CreateWebSocketURL = function CreateWebSocketURL(url) {
  if (url && !/^wss?:/i.test(url)) {
    var a = document.createElement("a");
    a.href = url;
    // Fix populating Location properties in IE. Otherwise, protocol will be blank.
    a.href = a.href;
    a.protocol = a.protocol.replace("http", "ws");
    return a.href;
  } else {
    return url;
  }
};

exports.default = {
  createConsumer: function createConsumer(url, options) {
    return new _Consumer2.default(CreateWebSocketURL(url), options);
  },
  endConsumer: function endConsumer(consumer) {
    consumer.subscriptions.removeAll();
    consumer.connection.close();
    consumer.connection.disconnect();
    consumer.connectionMonitor.stop();
  }
};