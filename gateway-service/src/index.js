// const express = require("express");
// const axios = require("axios");
// const redisClient = require("./redisClient");
// let routes = require("./routes");
// if (!Array.isArray(routes)) {
//   routes = Object.values(routes);
// }

// const app = express();
// const cors = require("cors");
// app.use(cors());
// app.use(express.json());

// console.log("Loaded routes:", routes);

// const rateLimit = require("express-rate-limit");
// const { RedisStore } = require("rate-limit-redis");

// const limiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 100, // Limit each IP to 100 requests per window
//   standardHeaders: true,
//   legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args) => redisClient.sendCommand(args),
//   }),
//   message: { error: "Too many requests, please try again later." }
// });

// // Apply rate limiter to all requests
// app.use(limiter);

// app.get("/", (req, res) => {
//   res.send("Gateway running ");
// });

// const { connectQueue, sendToQueue } = require("./queue");

// // DYNAMIC ROUTING
// app.use(async (req, res) => {
//   try {
//     const requestPath = req.path;
//     const cacheKey = req.originalUrl;
//     console.log("Checking route for path:", requestPath);

//     if (req.method === "GET") {
//       try {
//         const cachedResponse = await redisClient.get(cacheKey);
//         if (cachedResponse) {
//           console.log("cache hit");
//           sendToQueue({
//             method: req.method,
//             path: requestPath,
//             status: 200,
//             ip: req.ip,
//             timestamp: new Date().toISOString(),
//           });
//           return res.json(JSON.parse(cachedResponse));
//         }
//       } catch (err) {
//         console.error("Redis get error:", err);
//       }
//     }

//     // Find matching route
//     const route = routes.find((r) => requestPath.startsWith(r.prefix));

//     if (!route) {
//       console.log("No route found for path:", requestPath);
//       sendToQueue({
//         method: req.method,
//         path: requestPath,
//         status: 404,
//         ip: req.ip,
//         timestamp: new Date().toISOString(),
//       });
//       return res.status(404).json({ error: "No route found" });
//     }

//     // Remove prefix
//     const newPath = requestPath.replace(route.prefix, "");

//     // Construct target URL
//     const targetUrl = route.target + newPath;

//     console.log(`Forwarding ${req.method} ${requestPath} to ${targetUrl}`);

//     // Forward request
//     try {
//       const response = await axios({
//         method: req.method,
//         url: targetUrl,
//         data: req.body,
//         params: req.query,
//         headers: { ...req.headers, host: new URL(route.target).host }
//       });

//       if (req.method === "GET" && response.status >= 200 && response.status < 300) {
//         console.log("cache miss");
//         try {
//           await redisClient.setEx(cacheKey, 60, JSON.stringify(response.data));
//         } catch (err) {
//           console.error("Redis set error:", err);
//         }
//       }

//       sendToQueue({
//         method: req.method,
//         path: requestPath,
//         status: response.status,
//         ip: req.ip,
//         timestamp: new Date().toISOString(),
//       });

//       res.status(response.status).json(response.data);
//     } catch (forwardError) {
//       console.error("Forwarding error:", forwardError.message);
//       const statusCode = forwardError.response?.status || 500;
//       sendToQueue({
//         method: req.method,
//         path: requestPath,
//         status: statusCode,
//         ip: req.ip,
//         timestamp: new Date().toISOString(),
//       });
//       res.status(statusCode).json({
//         error: "Gateway forwarding error",
//         details: forwardError.message,
//         target: targetUrl
//       });
//     }
//   } catch (error) {
//     console.error("General gateway error:", error);
//     res.status(500).json({
//       error: "Gateway error",
//       details: error.message || String(error),
//     });
//   }
// });

// app.listen(5000, async () => {
//   await connectQueue();
//   console.log("Gateway running on port 5000");
// });
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const redisClient = require("./redisClient");
const { connectQueue, sendToQueue } = require("./queue");

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


//  HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Gateway running ");
});


// MAIN PROXY + CACHE + QUEUE
app.use(async (req, res) => {
  try {
    const requestPath = req.path;
    const cacheKey = req.originalUrl;

    console.log("Checking route for path:", requestPath);

    // CACHE CHECK (SAFE)
    if (req.method === "GET") {
      try {
        if (redisClient) {
          const cachedResponse = await redisClient.get(cacheKey);

          if (cachedResponse) {
            console.log("⚡ Cache HIT");

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
        console.log(" Redis unavailable (GET)");
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

    const newPath = requestPath.replace(route.prefix, "") || "/";
    const targetUrl = route.target + newPath;

    console.log(`Forwarding ${req.method} ${requestPath} → ${targetUrl}`);

    // FORWARD REQUEST
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        ...req.headers,
        host: new URL(route.target).host,
      },
    });

    // CACHE STORE (SAFE)
    if (req.method === "GET" && response.status >= 200 && response.status < 300) {
      try {
        if (redisClient) {
          await redisClient.setEx(
            cacheKey,
            60,
            JSON.stringify(response.data)
          );
          console.log("Cached response");
        }
      } catch (err) {
        console.log("Redis unavailable (SET)");
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
    console.error("Gateway error:", error.message);

    res.status(error.response?.status || 500).json({
      error: "Gateway error",
      details: error.message,
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

  console.log(`Gateway running on port ${PORT}`);
});