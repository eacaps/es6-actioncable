let Debugging = null;

export default {
  startDebugging: () => {
    return Debugging = true;
  },
  stopDebugging: () => {
    return Debugging = null;
  },
  log: (...messages) => {
    if (Debugging) {
      messages.push(Date.now());
      return console.log("[ActionCable]", ...messages);
    }
  }
};
