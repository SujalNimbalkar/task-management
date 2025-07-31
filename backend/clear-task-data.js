const mongoose = require("mongoose");
const Process = require("./src/models/Process");
const { FormSubmission } = require("./src/models/Form");
require("dotenv").config();

async function clearTaskData() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGODB_ATLAS_URI ||
      process.env.MONGODB_LOCAL_URI;
    if (!mongoUri) {
      console.error("❌ No MongoDB URI found in environment variables");
      console.log(
        "Please set MONGODB_URI, MONGODB_ATLAS_URI, or MONGODB_LOCAL_URI"
      );
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB successfully");

    // Clear all processes (which contain tasks)
    console.log("🗑️  Clearing all processes and tasks...");
    const processResult = await Process.deleteMany({});
    console.log(`✅ Deleted ${processResult.deletedCount} processes`);

    // Clear all form submissions
    console.log("🗑️  Clearing all form submissions...");
    const submissionResult = await FormSubmission.deleteMany({});
    console.log(`✅ Deleted ${submissionResult.deletedCount} form submissions`);

    // Verify data is cleared
    const remainingProcesses = await Process.countDocuments();
    const remainingSubmissions = await FormSubmission.countDocuments();

    console.log("\n📊 Verification:");
    console.log(`- Remaining processes: ${remainingProcesses}`);
    console.log(`- Remaining form submissions: ${remainingSubmissions}`);

    if (remainingProcesses === 0 && remainingSubmissions === 0) {
      console.log("✅ All task data has been successfully cleared!");
    } else {
      console.log("⚠️  Some data may still remain");
    }

    console.log("\n🚀 Ready for Render deployment!");
    console.log("Next steps:");
    console.log("1. Set up MongoDB Atlas cluster");
    console.log("2. Configure environment variables in Render");
    console.log("3. Deploy backend to Render");
    console.log("4. Test task triggers after deployment");
  } catch (error) {
    console.error("❌ Error clearing task data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
clearTaskData();
