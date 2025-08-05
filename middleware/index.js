const cors = require("cors");
const express = require("express");

// CORS middleware configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000", 
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-auth", "x-admin-email", "Origin", "Accept"],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Global middleware setup
const setupMiddleware = (app) => {
  // CORS
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Security headers
  app.use((req, res, next) => {
    res.header("X-Content-Type-Options", "nosniff");
    res.header("X-Frame-Options", "DENY");
    res.header("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log(`📍 Origin: ${req.get('Origin') || 'No origin'}`);
    console.log(`🔑 Authorization: ${req.get('Authorization') ? 'Present' : 'Not present'}`);
    next();
  });

  // Error handling for CORS
  app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
      console.log(`🚫 CORS Error: ${req.get('Origin')} not allowed`);
      return res.status(403).json({ 
        error: 'CORS Error', 
        message: 'Origin not allowed',
        origin: req.get('Origin')
      });
    }
    next(err);
  });
};

module.exports = setupMiddleware;
