require("dotenv").config();
const amqp = require("amqplib");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function startWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue("logs");

    console.log("✅ Worker connected to RabbitMQ");

    channel.consume("logs", async (msg) => {
      const data = JSON.parse(msg.content.toString());

      console.log("Log received:", data);

      try {
        await prisma.log.create({
          data: {
            path: data.path,
            method: data.method,
            status: data.status || 200,
            ip: data.ip,
            timestamp: new Date(data.timestamp),
          },
        });
        console.log("Log saved to DB successfully!");
      } catch (error) {
        console.error("Failed to save log to DB:", error);
      }

      channel.ack(msg);
    });
  } catch (error) {
    console.error("Worker failed to connect to RabbitMQ:", error.message);
    console.log("Worker will continue without RabbitMQ (Log collection disabled)");
  }
}

startWorker();

// Restore the Express server
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/some-endpoint", (req, res) => {
  res.json({
    message: "Worker service response 🚀",
  });
});

app.get("/analytics", async (req, res) => {
  try {
    const totalRequests = await prisma.log.count();
    const success = await prisma.log.count({
      where: {
        status: {
          gte: 200,
          lt: 300,
        },
      },
    });
    const errors = await prisma.log.count({
      where: {
        status: {
          gte: 400,
        },
      },
    });

    res.json({
      totalRequests,
      success,
      errors,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
app.get("/analytics/timeline", async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: "asc" },
    });

    // Group by minute
    const grouped = {};

    logs.forEach((log) => {
      const time = new Date(log.timestamp)
        .toISOString()
        .slice(0, 16); // YYYY-MM-DDTHH:MM

      if (!grouped[time]) {
        grouped[time] = 0;
      }

      grouped[time]++;
    });

    const result = Object.entries(grouped).map(([time, count]) => ({
      time,
      count,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/analytics/logs", async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: "desc" },
      take: 50, // latest 50 logs
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Worker HTTP server running on port ${PORT}`);
});