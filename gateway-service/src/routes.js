const WORKER_URL = process.env.WORKER_URL;

if (!WORKER_URL) {
  console.log("⚠️ WARNING: WORKER_URL is not set. Defaulting to localhost:5001 (Dev Mode only)");
}

const finalWorkerUrl = WORKER_URL || "http://localhost:5001";

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
    target: `${finalWorkerUrl}/analytics`,
  },
];