const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    //MONGODB_URI=mongodb://localhost:27017/careernest put this in backend/.env
    const MONGODB_URI = process.env.MONGODB_URI;

    // Check if MONGODB_URI is set
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in environment variables");
      console.log("💡 Please check your .env file in the Careernest-server directory");
      console.log("🔧 Expected format: MONGODB_URI=mongodb+srv://username:password@cluster...");
      process.exit(1);
    }

    console.log("🔗 Attempting to connect to MongoDB...");
    console.log("📊 URI:", MONGODB_URI.substring(0, 50) + "...");

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", MONGODB_URI);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log(
      "💡 Make sure MongoDB is running and MONGODB_URI is set correctly"
    );
    console.log(
      "🔧 You can set MONGODB_URI in your .env file or use the default localhost"
    );
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

module.exports = connectDB;
