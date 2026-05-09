const { createClient } = require("redis");

const redisClient = {
  client: null,
  async connectRedis() {
    try {
      if (!process.env.REDIS_URL) {
        console.log("⚠️ Redis disabled (no URL provided)");
        return;
      }

      this.client = createClient({
        url: process.env.REDIS_URL,
      });

      this.client.on("error", (err) => {
        console.log("⚠️ Redis error:", err.message);
      });

      await this.client.connect();
      console.log("✅ Connected to Redis");
    } catch (err) {
      console.log("⚠️ Redis connection failed:", err.message);
      this.client = null;
    }
  }
};

module.exports = redisClient;