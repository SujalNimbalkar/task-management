const databaseService = require("../services/databaseService");

async function getFormDefinitions(req, res) {
  try {
    const forms = await databaseService.getFormDefinitions();
    res.json(forms);
  } catch (error) {
    console.error("Error in getFormDefinitions:", error);
    res.status(500).json({ error: "Failed to fetch form definitions" });
  }
}

async function getFormDefinitionById(req, res) {
  try {
    const formId = req.params.formId;
    const form = await databaseService.getFormDefinitionById(formId);

    if (!form) {
      return res.status(404).json({ error: "Form definition not found" });
    }

    res.json(form);
  } catch (error) {
    console.error("Error in getFormDefinitionById:", error);
    res.status(500).json({ error: "Failed to fetch form definition" });
  }
}

async function createFormDefinition(req, res) {
  try {
    const formData = req.body;
    const newForm = await databaseService.createFormDefinition(formData);
    res.status(201).json(newForm);
  } catch (error) {
    console.error("Error in createFormDefinition:", error);
    res.status(500).json({ error: "Failed to create form definition" });
  }
}

async function updateFormDefinition(req, res) {
  try {
    const formId = req.params.formId;
    const formData = req.body;
    const updatedForm = await databaseService.updateFormDefinition(formId, formData);

    if (!updatedForm) {
      return res.status(404).json({ error: "Form definition not found" });
    }

    res.json(updatedForm);
  } catch (error) {
    console.error("Error in updateFormDefinition:", error);
    res.status(500).json({ error: "Failed to update form definition" });
  }
}

async function getFormSubmissions(req, res) {
  try {
    const filters = req.query;
    const submissions = await databaseService.getFormSubmissions(filters);
    res.json(submissions);
  } catch (error) {
    console.error("Error in getFormSubmissions:", error);
    res.status(500).json({ error: "Failed to fetch form submissions" });
  }
}

async function createFormSubmission(req, res) {
  try {
    const submissionData = req.body;
    const newSubmission = await databaseService.createFormSubmission(submissionData);
    res.status(201).json(newSubmission);
  } catch (error) {
    console.error("Error in createFormSubmission:", error);
    res.status(500).json({ error: "Failed to create form submission" });
  }
}

module.exports = {
  getFormDefinitions,
  getFormDefinitionById,
  createFormDefinition,
  updateFormDefinition,
  getFormSubmissions,
  createFormSubmission,
}; 