const fs = require("fs").promises;
const path = require("path");
const {
  readAllData,
  writeAllData,
  readUsers: readUsersModular,
  readForms: readFormsModular,
  readProcesses: readProcessesModular,
  writeUsers: writeUsersModular,
  writeForms: writeFormsModular,
  writeProcesses: writeProcessesModular,
  migrateFromOldDb,
} = require("./modularDbHelper");

// Check if modular files exist, if not, migrate from backup db.json
async function ensureModularStructure() {
  try {
    const modularDbHelper = require("./modularDbHelper");
    const users = await modularDbHelper.readUsers();
    const forms = await modularDbHelper.readForms();
    const processes = await modularDbHelper.readProcesses();

    // If any of the modular files are empty or don't exist, migrate from backup
    if (
      !users ||
      !forms ||
      !processes ||
      users.length === 0 ||
      Object.keys(forms).length === 0 ||
      processes.length === 0
    ) {
      console.log(
        "Modular files not found or empty, checking for backup db.json..."
      );
      await migrateFromOldDb();
    }
  } catch (error) {
    console.log("Modular structure not found, checking for backup db.json...");
    await migrateFromOldDb();
  }
}

// Initialize modular structure on first load
let isInitialized = false;
async function initializeModularStructure() {
  if (!isInitialized) {
    await ensureModularStructure();
    isInitialized = true;
  }
}

async function readDB() {
  await initializeModularStructure();
  return await readAllData();
}

async function writeDB(data) {
  await initializeModularStructure();
  return await writeAllData(data);
}

// Backward compatibility functions
async function readUsers() {
  await initializeModularStructure();
  return await readUsersModular();
}

async function readForms() {
  await initializeModularStructure();
  return await readFormsModular();
}

async function readProcesses() {
  await initializeModularStructure();
  return await readProcessesModular();
}

async function writeUsers(users) {
  await initializeModularStructure();
  return await writeUsersModular(users);
}

async function writeForms(forms) {
  await initializeModularStructure();
  return await writeFormsModular(forms);
}

async function writeProcesses(processes) {
  await initializeModularStructure();
  return await writeProcessesModular(processes);
}

module.exports = {
  readDB,
  writeDB,
  readUsers,
  readForms,
  readProcesses,
  writeUsers,
  writeForms,
  writeProcesses,
};
