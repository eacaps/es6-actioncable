import Consumer from './cable/Consumer';

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
  createConsumer: (url, options) => {
    return new Consumer(CreateWebSocketURL(url), options);
  },
  endConsumer: (consumer) => {
    consumer.connection.close();
    consumer.connection.disconnect();
    consumer.connectionMonitor.stop();
  }
};
