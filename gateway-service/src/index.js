const express = require("express");
const axios = require("axios");
let routes = require("./routes");
if (!Array.isArray(routes)) {
  routes = Object.values(routes);
}

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
      console.log("No route found for path:", requestPath);
      return res.status(404).json({ error: "No route found" });
    }

    // Remove prefix
    const newPath = requestPath.replace(route.prefix, "");

    // Construct target URL
    const targetUrl = route.target + newPath;

    console.log(`Forwarding ${req.method} ${requestPath} to ${targetUrl}`);

    // Forward request
    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: { ...req.headers, host: new URL(route.target).host }
      });

      res.status(response.status).json(response.data);
    } catch (forwardError) {
      console.error("Forwarding error:", forwardError.message);
      res.status(forwardError.response?.status || 500).json({
        error: "Gateway forwarding error",
        details: forwardError.message,
        target: targetUrl
      });
    }
  } catch (error) {
    console.error("General gateway error:", error);
    res.status(500).json({
      error: "Gateway error",
      details: error.message || String(error),
    });
  }
});

app.listen(5000, () => {
  console.log("Gateway running on port 5000");
});
