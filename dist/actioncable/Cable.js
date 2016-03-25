"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _cableConsumer = require('./cable/Consumer');

var _cableConsumer2 = _interopRequireDefault(_cableConsumer);

exports["default"] = {
  PING_IDENTIFIER: "_ping",
  createConsumer: function createConsumer(url, options) {
    return new _cableConsumer2["default"](url, options);
  },
  // eac added 20150908
  endConsumer: function endConsumer(consumer) {
    consumer.connection.close();
    consumer.connectionMonitor.stop();
  }
};
module.exports = exports["default"];