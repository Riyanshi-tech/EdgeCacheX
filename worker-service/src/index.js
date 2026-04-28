const express = require("express");
const app = express();

app.get("/some-endpoint", (req, res) => {
  res.json({
    message: "Worker service response 🚀",
  });
});

app.listen(5001, () => {
  console.log("Worker running on port 5001");
});