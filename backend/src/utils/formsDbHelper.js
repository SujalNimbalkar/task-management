const fs = require("fs/promises");
const path = require("path");

const FORMS_DB_PATH = path.join(__dirname, "../../data/forms.json");

async function readFormsDB() {
  try {
    const data = await fs.readFile(FORMS_DB_PATH, "utf-8");
    const formsData = JSON.parse(data);

    // Ensure the data has both form definitions and submissions
    if (!formsData.submissions) {
      formsData.submissions = [];
    }

    return formsData;
  } catch (error) {
    // If file doesn't exist or is corrupted, return empty structure with submissions
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
      console.warn(
        "Forms database file is missing or corrupted, creating fresh structure"
      );
      return { submissions: [] };
    }
    throw error;
  }
}

async function writeFormsDB(data) {
  try {
    // Read the current file to preserve form definitions, but handle corruption gracefully
    let currentData;
    try {
      currentData = await readFormsDB();
    } catch (error) {
      console.warn("Could not read existing forms database, starting fresh");
      currentData = { submissions: [] };
    }

    // Merge the new data with existing form definitions
    const updatedData = {
      ...currentData,
      submissions: data.submissions || currentData.submissions,
    };

    // Write atomically by writing to a temporary file first
    const tempPath = FORMS_DB_PATH + ".tmp";
    await fs.writeFile(tempPath, JSON.stringify(updatedData, null, 2));
    await fs.rename(tempPath, FORMS_DB_PATH);
  } catch (error) {
    console.error("Error writing forms database:", error);
    throw error;
  }
}

module.exports = {
  readFormsDB,
  writeFormsDB,
};
