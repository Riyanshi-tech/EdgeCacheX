const amqp = require("amqplib");

let channel;

async function connectQueue() {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();

  await channel.assertQueue("logs");

  console.log("✅ Connected to RabbitMQ");
}

function sendToQueue(data) {
  if (!channel) return;

  channel.sendToQueue(
    "logs",
    Buffer.from(JSON.stringify(data))
  );
}

module.exports = { connectQueue, sendToQueue };