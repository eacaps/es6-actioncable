"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Debugging = null;

exports.default = {
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