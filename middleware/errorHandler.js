// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      error: "Validation Error",
      details: errors,
    });
  }

  // Mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || "Something went wrong!",
  });
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  errorHandler,
  notFound,
};
