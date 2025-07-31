const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
} = require("../controllers/userController");

// Get all users
router.get("/", getUsers);

// Get user by email
router.get("/email/:email", getUserByEmail);

// Get user by ID
router.get("/:id", getUserById);

// Create new user
router.post("/", createUser);

// Update user
router.put("/:id", updateUser);

// Delete user (soft delete)
router.delete("/:id", deleteUser);

// Get users by role
router.get("/role/:role", getUsersByRole);

module.exports = router;
