const fs = require("fs").promises;
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "data", "db.json");

async function readDB() {
  const data = await fs.readFile(dbPath, "utf8");
  return JSON.parse(data);
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readDB, writeDB };
