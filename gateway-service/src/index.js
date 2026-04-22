const express = require("express");
const axios = require("axios");
const routes = require("./routes");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gateway running ");
});

// DYNAMIC ROUTING
app.use(async (req, res) => {
  try {
    const requestPath = req.path;

    // Find matching route
    const route = routes.find((r) => requestPath.startsWith(r.prefix));

    if (!route) {
      return res.status(404).json({ error: "No route found" });
    }

    // Remove prefix
    const newPath = requestPath.replace(route.prefix, "");

    // Construct target URL
    const targetUrl = route.target + newPath;

    console.log("Forwarding to:", targetUrl);

    // Forward request
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Gateway error",
      details: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Gateway running on port 5000");
});
