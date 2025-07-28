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
} = require("../controllers/taskController");
const { findTask } = require("../controllers/taskController");
const { triggerDependentTasks } = require("../services/taskTriggers");
const { readDB, writeDB } = require("../utils/dbHelper");
const { readFormsDB } = require("../utils/formsDbHelper");

router.get("/users", getUsers);

router.get("/", getTasks);

router.post("/:id/complete", completeTask);

router.post("/:id/update", updateTask);

router.post("/:id/submit-form", submitTaskForm);

router.get("/:id/form-submissions", getFormSubmissions);

router.get("/form-submissions", getAllFormSubmissionsForUser);

router.post("/trigger-event", triggerEvent);

router.get("/:id/export-excel", exportTaskToExcel);

module.exports = router;
