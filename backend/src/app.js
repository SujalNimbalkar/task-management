const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./config/database");
const databaseService = require("./services/databaseService");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const formRoutes = require("./routes/formRoutes");
const processRoutes = require("./routes/processRoutes");
const testRoutes = require("./routes/testRoutes");
// require("./jobs/recurringTasks"); // Temporarily disabled due to MongoDB migration

const app = express();

// Connect to database
connectToDatabase();

// Initialize database service
databaseService.initialize();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/test", testRoutes);

module.exports = app;
