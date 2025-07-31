const fs = require("fs").promises;
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");

// Helper function to read JSON file
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// Helper function to write JSON file
async function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// Read all data from separate files
async function readAllData() {
  try {
    const [users, forms, processes] = await Promise.all([
      readJsonFile("users.json"),
      readJsonFile("forms.json"),
      readJsonFile("processes.json"),
    ]);

    return {
      users: users || [],
      forms: forms || {},
      processes: processes || [],
    };
  } catch (error) {
    console.error("Error reading all data:", error);
    return {
      users: [],
      forms: {},
      processes: [],
    };
  }
}

// Write all data to separate files
async function writeAllData(data) {
  try {
    const results = await Promise.all([
      writeJsonFile("users.json", data.users),
      writeJsonFile("forms.json", data.forms),
      writeJsonFile("processes.json", data.processes),
    ]);

    return results.every((result) => result === true);
  } catch (error) {
    console.error("Error writing all data:", error);
    return false;
  }
}

// Read specific data types
async function readUsers() {
  return (await readJsonFile("users.json")) || [];
}

async function readForms() {
  return (await readJsonFile("forms.json")) || {};
}

async function readProcesses() {
  return (await readJsonFile("processes.json")) || [];
}

// Write specific data types
async function writeUsers(users) {
  return await writeJsonFile("users.json", users);
}

async function writeForms(forms) {
  return await writeJsonFile("forms.json", forms);
}

async function writeProcesses(processes) {
  return await writeJsonFile("processes.json", processes);
}

// Update specific data types
async function updateUsers(updateFunction) {
  const users = await readUsers();
  const updatedUsers = updateFunction(users);
  return await writeUsers(updatedUsers);
}

async function updateForms(updateFunction) {
  const forms = await readForms();
  const updatedForms = updateFunction(forms);
  return await writeForms(updatedForms);
}

async function updateProcesses(updateFunction) {
  const processes = await readProcesses();
  const updatedProcesses = updateFunction(processes);
  return await writeProcesses(updatedProcesses);
}

// Migration helper to convert from backup db.json to new structure
async function migrateFromOldDb() {
  try {
    // Try backup file first, then original file
    let oldDbPath = path.join(DATA_DIR, "db.json.backup");
    let oldData;

    try {
      oldData = await fs.readFile(oldDbPath, "utf8");
      console.log("Using backup db.json for migration");
    } catch (error) {
      // Try original file if backup doesn't exist
      oldDbPath = path.join(DATA_DIR, "db.json");
      oldData = await fs.readFile(oldDbPath, "utf8");
      console.log("Using original db.json for migration");
    }

    const oldDb = JSON.parse(oldData);

    // Write separate files
    await Promise.all([
      writeJsonFile("users.json", oldDb.users || []),
      writeJsonFile("forms.json", oldDb.forms || {}),
      writeJsonFile("processes.json", oldDb.processes || []),
    ]);

    console.log("Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
}

module.exports = {
  readAllData,
  writeAllData,
  readUsers,
  readForms,
  readProcesses,
  writeUsers,
  writeForms,
  writeProcesses,
  updateUsers,
  updateForms,
  updateProcesses,
  migrateFromOldDb,
};
