const WORKER_URL = process.env.WORKER_URL || "http://localhost:5001";

module.exports = [
  {
    prefix: "/api",
    target: "https://jsonplaceholder.typicode.com",
  },
  {
    prefix: "/worker",
    target: WORKER_URL,
  },
  {
    prefix: "/analytics",
    target: `${WORKER_URL}/analytics`,
  },
];