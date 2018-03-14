let Debugging = null;

export default {
  startDebugging: () => {
    Debugging = true;
  },
  stopDebugging: () => {
    Debugging = null;
  },
  log: (...messages) => {
    if (Debugging) {
      messages.push(Date.now());
      return console.log('[ActionCable]', ...messages); // eslint-disable-line no-console
    }
    return true;
  },
};
