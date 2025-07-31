const express = require("express");
const router = express.Router();
const {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
} = require("../controllers/processController");

// Get all processes
router.get("/", getProcesses);

// Get process by ID
router.get("/:id", getProcessById);

// Create new process
router.post("/", createProcess);

// Update process
router.put("/:id", updateProcess);

// Delete process
router.delete("/:id", deleteProcess);

module.exports = router; 