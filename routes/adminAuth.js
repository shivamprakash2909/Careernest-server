const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();

// Verify admin token middleware
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Check if admin still exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    next(error);
  }
};

// Admin Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email, 
        role: admin.role,
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: admin.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// Change Admin Password
router.put("/change-password", verifyAdminToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    req.admin.password = newPassword;
    await req.admin.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update Admin Name
router.put("/update-name", verifyAdminToken, async (req, res, next) => {
  try {
    const { newName } = req.body;

    if (!newName || newName.trim().length === 0) {
      return res.status(400).json({ error: "New name is required" });
    }

    if (newName.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters long" });
    }

    req.admin.name = newName.trim();
    await req.admin.save();

    res.json({ 
      message: "Name updated successfully",
      admin: req.admin.toPublicJSON()
    });
  } catch (error) {
    next(error);
  }
});

// Get admin profile
router.get("/profile", verifyAdminToken, async (req, res) => {
  try {
    res.json({
      admin: req.admin.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// Create initial admin (for setup)
router.post("/setup", async (req, res, next) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const admin = new Admin({
      email: email.toLowerCase(),
      password,
      name,
      role: "super_admin",
    });

    await admin.save();

    res.status(201).json({
      message: "Admin created successfully",
      admin: admin.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token removal)
router.post("/logout", verifyAdminToken, async (req, res) => {
  try {
    res.json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, verifyAdminToken }; 