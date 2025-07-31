const express = require("express");
const router = express.Router();
const {
  getUsers,
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
  getFormSubmissions,
  getAllFormSubmissionsForUser,
  triggerEvent,
  exportTaskToExcel,
  approveDailyTask,
  rejectDailyTask,
  reassignDailyTask,
  exportTaskToPDF,
  assignTaskToUser,
  getAvailableUsersForRole,
  deleteTask,
} = require("../controllers/taskController");
const { findTask } = require("../controllers/taskController");

router.get("/users", getUsers);

router.get("/", getTasks);

router.post("/:id/complete", completeTask);

router.post("/:id/update", updateTask);

router.post("/:id/submit-form", submitTaskForm);

router.get("/:id/form-submissions", getFormSubmissions);

router.get("/form-submissions", getAllFormSubmissionsForUser);

router.post("/trigger-event", triggerEvent);

router.get("/:id/export-excel", exportTaskToExcel);
router.get("/:id/export-pdf", exportTaskToPDF);

router.post("/:id/approve", approveDailyTask);
router.post("/:id/reject", rejectDailyTask);
router.post("/:id/reassign", reassignDailyTask);

// New routes for user assignment
router.post("/:id/assign-user", assignTaskToUser);
router.get("/available-users/:role", getAvailableUsersForRole);

// Delete task route
router.delete("/:id", deleteTask);

module.exports = router;
