const express = require("express");
const axios = require("axios");
const cors = require("cors");

const redisClient = require("./redisClient");
const { connectQueue, sendToQueue } = require("./queue");
const { connectRedis } = redisClient;

let routes = require("./routes");
if (!Array.isArray(routes)) {
  routes = Object.values(routes);
}

const app = express();

app.use(cors());
app.use(express.json());

console.log("Loaded routes:", routes);


// SAFE RATE LIMIT (NO REDIS)
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use(limiter);


// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Gateway running");
});


// MAIN PROXY + CACHE + QUEUE
app.use(async (req, res) => {
  let targetUrl = "";
  try {
    const requestPath = req.path;
    const cacheKey = req.originalUrl;

    console.log("Checking route for path:", requestPath);

    // CACHE CHECK (SAFE)
    if (req.method === "GET") {
      try {
        if (redisClient.client) {
          const cachedResponse = await redisClient.client.get(cacheKey);

          if (cachedResponse) {
            console.log("Cache HIT");

            sendToQueue({
              method: req.method,
              path: requestPath,
              status: 200,
              ip: req.ip,
              timestamp: new Date().toISOString(),
            });

            return res.json(JSON.parse(cachedResponse));
          }
        }
      } catch (err) {
        console.log("Redis unavailable (GET):", err.message);
      }
    }

    // FIND ROUTE
    const route = routes.find((r) =>
      requestPath.startsWith(r.prefix)
    );

    if (!route) {
      console.log("No route found");

      sendToQueue({
        method: req.method,
        path: requestPath,
        status: 404,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(404).json({ error: "No route found" });
    }

    // Fixed path logic to avoid double slashes
    const newPath = requestPath.replace(route.prefix, "");
    targetUrl = route.target + newPath;

    // Ensure targetUrl has protocol
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    console.log(`Forwarding ${req.method} ${requestPath} -> ${targetUrl}`);

    // Safe Host Header calculation
    let targetHost;
    try {
      const urlForHost = route.target.startsWith("http") ? route.target : "https://" + route.target;
      targetHost = new URL(urlForHost).host;
    } catch (e) {
      targetHost = route.target;
    }

    // FORWARD REQUEST
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        ...req.headers,
        host: targetHost,
      },
    });

    // CACHE STORE (SAFE)
    if (req.method === "GET" && response.status >= 200 && response.status < 300) {
      try {
        if (redisClient.client) {
          await redisClient.client.setEx(
            cacheKey,
            60,
            JSON.stringify(response.data)
          );
          console.log("Cached response");
        }
      } catch (err) {
        console.log("Redis unavailable (SET):", err.message);
      }
    }

    // LOG TO QUEUE (SAFE)
    sendToQueue({
      method: req.method,
      path: requestPath,
      status: response.status,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    res.status(response.status).json(response.data);

  } catch (error) {
    console.error(`Gateway error on ${req.method} ${req.path}:`, error.message);
    
    res.status(error.response?.status || 500).json({
      error: "Gateway error",
      details: error.message,
      path: req.path,
      target: targetUrl
    });
  }
});


// PORT FIX FOR RENDER
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await connectQueue();
  } catch (err) {
    console.log("Queue not connected");
  }

  try {
    await connectRedis();
  } catch (err) {
    console.log("Redis not connected");
  }

  console.log(`Gateway running on port ${PORT}`);
});