const express = require("express");
const router = express.Router();
const {
  getUsers,
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
} = require("../controllers/taskController");

router.get("/users", getUsers);

router.get("/tasks", getTasks);

router.post("/tasks/:id/complete", completeTask);

router.post("/tasks/:id/update", updateTask);

router.post("/tasks/:id/submit-form", submitTaskForm);

module.exports = router;
