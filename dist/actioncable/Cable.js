"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Consumer = require("./cable/Consumer");

var _Consumer2 = _interopRequireDefault(_Consumer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Debugging = null;

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
  createConsumer: function createConsumer(url) {
    return new _Consumer2.default(CreateWebSocketURL(url));
  },
  startDebugging: function startDebugging() {
    return Debugging = true;
  },
  stopDebugging: function stopDebugging() {
    return Debugging = null;
  },
  log: function log() {
    for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
      messages[_key] = arguments[_key];
    }

    if (Debugging) {
      var _console;

      messages.push(Date.now());
      return (_console = console).log.apply(_console, ["[ActionCable]"].concat(messages));
    }
  }
};