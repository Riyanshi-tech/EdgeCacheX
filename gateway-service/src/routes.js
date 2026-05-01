module.exports = [
  {
    prefix: "/api",
    target: "https://jsonplaceholder.typicode.com",
  },
  {
    prefix: "/worker",
    target: "http://localhost:5001",
  },
  {
    prefix: "/analytics",
    target: "http://localhost:5001/analytics",
  },
];