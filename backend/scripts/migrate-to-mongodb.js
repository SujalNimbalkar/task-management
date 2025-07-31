#!/usr/bin/env node

/**
 * Migration Script: JSON Files to MongoDB
 *
 * This script migrates your existing JSON file data to MongoDB.
 *
 * Usage:
 * 1. Set USE_MONGODB=true in your .env file
 * 2. Ensure MongoDB is running (local or Atlas)
 * 3. Run: node scripts/migrate-to-mongodb.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { connectToDatabase } = require("../src/config/database");
const databaseService = require("../src/services/databaseService");

async function runMigration() {
  console.log("🚀 Starting JSON to MongoDB migration...\n");

  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Check if MongoDB is enabled
    if (!databaseService.isMongoDBEnabled()) {
      console.log(
        "❌ MongoDB is not enabled. Please set USE_MONGODB=true in your .env file"
      );
      process.exit(1);
    }

    console.log("📊 Database type:", databaseService.getDatabaseType());
    console.log("🔗 MongoDB connection established\n");

    // Run the migration
    const success = await databaseService.migrateFromJsonToMongo();

    if (success) {
      console.log("\n✅ Migration completed successfully!");
      console.log("\n📋 Next steps:");
      console.log("1. Test your application with MongoDB");
      console.log("2. Verify all data has been migrated correctly");
      console.log(
        "3. Once confirmed, you can backup and remove the JSON files"
      );
      console.log("4. Set USE_MONGODB=true permanently in your .env file");
    } else {
      console.log(
        "\n❌ Migration failed. Please check the error messages above."
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === "--help" || command === "-h") {
  console.log(`
JSON to MongoDB Migration Script

Usage:
  node scripts/migrate-to-mongodb.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be migrated without actually migrating
  --backup       Create a backup of JSON files before migration

Environment Variables:
  USE_MONGODB    Set to 'true' to enable MongoDB
  MONGODB_LOCAL_URI  Local MongoDB connection string
  MONGODB_URI    Production MongoDB connection string

Examples:
  # Run migration
  node scripts/migrate-to-mongodb.js

  # Show help
  node scripts/migrate-to-mongodb.js --help
`);
  process.exit(0);
}

if (command === "--dry-run") {
  console.log("🔍 Dry run mode - no data will be migrated");
  // TODO: Implement dry run functionality
  process.exit(0);
}

if (command === "--backup") {
  console.log("📦 Backup mode - creating backup before migration");
  // TODO: Implement backup functionality
  process.exit(0);
}

// Run the migration
runMigration();
