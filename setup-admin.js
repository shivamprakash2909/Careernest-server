const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv").config();

async function setupAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/careernest");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create default admin
    const admin = new Admin({
      email: "admin@careernest.com",
      password: "careernestadmin123", // This will be hashed automatically
      name: "CareerNest Admin",
      role: "super_admin",
      permissions: {
        canApproveJobs: true,
        canApproveInternships: true,
        canManageUsers: true,
        canViewAnalytics: true,
      },
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log(`Email:${admin.email}`);
    console.log(`Password:careernestadmin123`);
    console.log("Please change the password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  }
}

setupAdmin();
