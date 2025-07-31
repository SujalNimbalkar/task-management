const express = require("express");
const router = express.Router();
const {
  getFormDefinitions,
  getFormDefinitionById,
  createFormDefinition,
  updateFormDefinition,
  getFormSubmissions,
  createFormSubmission,
} = require("../controllers/formController");

// Get all form definitions
router.get("/", getFormDefinitions);

// Get form submissions (with optional filters) - MUST come before /:formId
router.get("/submissions", getFormSubmissions);

// Create new form submission
router.post("/submissions", createFormSubmission);

// Get form definition by ID
router.get("/:formId", getFormDefinitionById);

// Create new form definition
router.post("/", createFormDefinition);

// Update form definition
router.put("/:formId", updateFormDefinition);

module.exports = router;
