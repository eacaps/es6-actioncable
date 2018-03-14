import Consumer from './Cable/Consumer';

const CreateWebSocketURL = (url) => {
  if (url && !/^wss?:/i.test(url)) {
    const a = document.createElement('a');
    a.href = url;
    // Fix populating Location properties in IE. Otherwise, protocol will be blank.
    a.href = a.href;
    a.protocol = a.protocol.replace('http', 'ws');
    return a.href;
  }
  return url;
};

export default {
  createConsumer: (url, options) => (
    new Consumer(CreateWebSocketURL(url), options)
  ),
  endConsumer: (consumer) => {
    consumer.connection.close();
    consumer.connection.disconnect();
    consumer.connectionMonitor.stop();
  },
};
