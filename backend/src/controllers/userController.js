const { readDB } = require("../utils/dbHelper");

async function getUsers(req, res) {
  const db = await readDB();
  res.json(db.users);
}

module.exports = {
  getUsers,
};
