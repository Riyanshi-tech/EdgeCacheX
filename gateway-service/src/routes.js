const WORKER_URL = process.env.WORKER_URL;

if (!WORKER_URL) {
  console.log("WARNING: WORKER_URL is not set. Defaulting to localhost:5001 (Dev Mode only)");
}

// Clean up trailing slash from the base URL if it exists
const finalWorkerUrl = (WORKER_URL || "http://localhost:5001").replace(/\/$/, "");

module.exports = [
  {
    prefix: "/api",
    target: "https://jsonplaceholder.typicode.com",
  },
  {
    prefix: "/worker",
    target: finalWorkerUrl,
  },
  {
    prefix: "/analytics",
    target: finalWorkerUrl + "/analytics", // Ensure single slash
  },
];