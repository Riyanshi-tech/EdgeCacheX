const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Gateway is running");
});
app.get("/proxy", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const response = await axios.get(url);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch from target API",
      details: error.message,
    });
  }
});
app.listen(5000, () => {
  console.log("Gateway running on port 5000");
});
