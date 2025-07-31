require("dotenv").config();
const mongoose = require("mongoose");

// Database configuration
const getDatabaseConfig = () => {
  // Priority: MONGODB_ATLAS_URI > MONGODB_URI > Local
  if (process.env.MONGODB_ATLAS_URI) {
    return {
      uri: process.env.MONGODB_ATLAS_URI,
      options: {
        ssl: true,
        retryWrites: true,
      },
    };
  }

  if (process.env.MONGODB_URI) {
    return {
      uri: process.env.MONGODB_URI,
      options: {
        ssl: true,
        retryWrites: true,
      },
    };
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    // Local MongoDB connection
    return {
      uri:
        process.env.MONGODB_LOCAL_URI ||
        "mongodb://localhost:27017/rbac_system",
      options: {},
    };
  } else {
    // Production MongoDB connection
    return {
      uri: process.env.MONGODB_ATLAS_URI,
      options: {
        // Add any production-specific options here
        ssl: true,
        retryWrites: true,
      },
    };
  }
};

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const config = getDatabaseConfig();

    if (!config.uri) {
      throw new Error(
        "MongoDB URI not configured. Please set MONGODB_URI or MONGODB_LOCAL_URI environment variable."
      );
    }

    await mongoose.connect(config.uri, config.options);

    console.log(
      `✅ Connected to MongoDB: ${
        config.uri.includes("localhost") ? "Local" : "Production"
      }`
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = {
  connectToDatabase,
  getDatabaseConfig,
};
