const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-consumer',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const consumer = kafka.consumer({ groupId: 'group-id' });

const consumeMessages = async (topic) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value.toString()}`);
    },
  });
};

consumeMessages('joueur1_topic');
