const express = require("express");
const router = express.Router();
const {
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
} = require("../controllers/taskController");

router.get("/", getTasks);
router.post("/:id/complete", completeTask);
router.post("/:id/update", updateTask);
router.post("/:id/submit-form", submitTaskForm);

module.exports = router;
