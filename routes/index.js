const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    message: "CareerNest Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth/*",
      users: "/api/users/*",
      jobs: "/api/jobs/*",
      applications: "/api/applications/*",
      health: "/api/health",
    },
  });
});

module.exports = router;
