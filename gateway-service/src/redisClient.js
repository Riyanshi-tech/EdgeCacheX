const { createClient } = require("redis");

let client = null;

async function connectRedis() {
  try {
    if (!process.env.REDIS_URL) {
      console.log("⚠️ Redis disabled (no URL provided)");
      return;
    }

    client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on("error", (err) => {
      console.log("⚠️ Redis error:", err.message);
    });

    await client.connect();
    console.log("✅ Connected to Redis");
  } catch (err) {
    console.log("⚠️ Redis connection failed, continuing without it");
  }
}

module.exports = { client, connectRedis };