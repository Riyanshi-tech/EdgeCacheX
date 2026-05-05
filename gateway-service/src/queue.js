const amqp = require("amqplib");

let channel;

async function connectQueue() {
  try {
    if (!process.env.RABBITMQ_URL) {
      console.log("RabbitMQ disabled (no URL provided)");
      return;
    }

    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertQueue("logs");

    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.log("RabbitMQ connection failed, continuing without it");
  }
}

function sendToQueue(data) {
  if (!channel) return;

  channel.sendToQueue(
    "logs",
    Buffer.from(JSON.stringify(data))
  );
}

module.exports = { connectQueue, sendToQueue };