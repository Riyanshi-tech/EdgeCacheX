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
    console.log("RabbitMQ connection failed:", err.message);
    // In a containerized environment, we might want to exit here
    // but we'll follow the user's advice for the sendToQueue function.
  }
}

function sendToQueue(data) {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Check your RABBITMQ_URL and container status.");
  }

  channel.sendToQueue(
    "logs",
    Buffer.from(JSON.stringify(data))
  );
}

module.exports = { connectQueue, sendToQueue };