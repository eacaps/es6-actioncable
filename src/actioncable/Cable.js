import Consumer from './cable/Consumer';

export default {
  PING_IDENTIFIER: "_ping",
  createConsumer: (url) => {
    return new Consumer(url);
  },
  // eac added 20150908
  endConsumer: (consumer) => {
    consumer.connection.close();
    consumer.connectionMonitor.stop();
  }
};