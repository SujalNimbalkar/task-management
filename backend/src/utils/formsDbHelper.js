const fs = require("fs/promises");
const path = require("path");

const FORMS_DB_PATH = path.join(__dirname, "../../data/forms.json");

async function readFormsDB() {
  try {
    const data = await fs.readFile(FORMS_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty submissions structure
    if (error.code === "ENOENT") {
      return { submissions: [] };
    }
    throw error;
  }
}

async function writeFormsDB(data) {
  await fs.writeFile(FORMS_DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  readFormsDB,
  writeFormsDB,
};
