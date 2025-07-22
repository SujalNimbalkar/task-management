const fs = require("fs").promises;
const path = require("path");

const formsDbPath = path.join(__dirname, "..", "..", "data", "forms.json");

async function readFormsDB() {
  const data = await fs.readFile(formsDbPath, "utf8");
  return JSON.parse(data);
}

module.exports = { readFormsDB };
