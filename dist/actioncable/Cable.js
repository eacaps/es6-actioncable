import Consumer from './cable/Consumer';

export default {
  PING_IDENTIFIER: "_ping",
  createConsumer: (url, options) => {
    return new Consumer(url, options);
  },
  // eac added 20150908
  endConsumer: consumer => {
    consumer.connection.close();
    consumer.connectionMonitor.stop();
  }
};