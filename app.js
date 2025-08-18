const express = require("express");
const path = require("path");

// Load environment variables with explicit path
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Debug: Log environment variables
console.log("🔧 Environment Variables:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Not set");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("PORT:", process.env.PORT || 5000);

// Create the Express app
const app = express();

// Import configurations and middleware
const connectDB = require("./config/database");
connectDB();
const setupMiddleware = require("./middleware");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/userroutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const seedRoutes = require("./routes/seed");
const googleAuthRoutes = require("./routes/googleAuth");
const { router: adminAuthRoutes } = require("./routes/adminAuth");
const recruiterAuthRoutes = require("./routes/recruiterAuth");

// Setup middleware
setupMiddleware(app);

// API routes
// app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use("/api", indexRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api", seedRoutes);
app.use("/api", googleAuthRoutes);
app.use("/api", recruiterAuthRoutes);

// Legacy routes for backward compatibility
app.use("/", userRoutes); // Legacy routes without /api prefix
app.use("/", jobRoutes); // Legacy internship routes
// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
});
