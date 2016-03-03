import Consumer from './cable/Consumer';

let Debugging = null;

let CreateWebSocketURL = (url) => {
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
}

export default {
  createConsumer: (url) => {
    return new Consumer(CreateWebSocketURL(url));
  },
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
