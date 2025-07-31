const databaseService = require("../services/databaseService");

async function getUsers(req, res) {
  try {
    const users = await databaseService.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await databaseService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function getUserByEmail(req, res) {
  try {
    const email = req.params.email;
    const user = await databaseService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function createUser(req, res) {
  try {
    const userData = req.body;
    const newUser = await databaseService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const userData = req.body;
    const updatedUser = await databaseService.updateUser(userId, userData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const result = await databaseService.deleteUser(userId);

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

async function getUsersByRole(req, res) {
  try {
    const role = req.params.role;
    const users = await databaseService.getUsers();
    const filteredUsers = users.filter(user => 
      user.roles && user.roles.includes(role)
    );
    
    res.json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersByRole:", error);
    res.status(500).json({ error: "Failed to fetch users by role" });
  }
}

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
};
