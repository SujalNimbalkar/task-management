const databaseService = require("../services/databaseService");

async function getProcesses(req, res) {
  try {
    const processes = await databaseService.getProcesses();
    res.json(processes);
  } catch (error) {
    console.error("Error in getProcesses:", error);
    res.status(500).json({ error: "Failed to fetch processes" });
  }
}

async function getProcessById(req, res) {
  try {
    const processId = req.params.id;
    const process = await databaseService.getProcessById(processId);

    if (!process) {
      return res.status(404).json({ error: "Process not found" });
    }

    res.json(process);
  } catch (error) {
    console.error("Error in getProcessById:", error);
    res.status(500).json({ error: "Failed to fetch process" });
  }
}

async function createProcess(req, res) {
  try {
    const processData = req.body;
    const newProcess = await databaseService.createProcess(processData);
    res.status(201).json(newProcess);
  } catch (error) {
    console.error("Error in createProcess:", error);
    res.status(500).json({ error: "Failed to create process" });
  }
}

async function updateProcess(req, res) {
  try {
    const processId = req.params.id;
    const processData = req.body;
    const updatedProcess = await databaseService.updateProcess(processId, processData);

    if (!updatedProcess) {
      return res.status(404).json({ error: "Process not found" });
    }

    res.json(updatedProcess);
  } catch (error) {
    console.error("Error in updateProcess:", error);
    res.status(500).json({ error: "Failed to update process" });
  }
}

async function deleteProcess(req, res) {
  try {
    const processId = req.params.id;
    const result = await databaseService.deleteProcess(processId);

    if (!result) {
      return res.status(404).json({ error: "Process not found" });
    }

    res.json({ message: "Process deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProcess:", error);
    res.status(500).json({ error: "Failed to delete process" });
  }
}

module.exports = {
  getProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
}; 