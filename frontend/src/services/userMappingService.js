import { fetchUsers } from "./api";

class UserMappingService {
  constructor() {
    this.userMap = new Map();
    this.databaseUsers = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("Initializing user mapping service...");
      this.databaseUsers = await fetchUsers();
      console.log("Loaded database users:", this.databaseUsers);
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize user mapping:", error);
      throw error;
    }
  }

  // Map Firebase user to database user by email
  mapFirebaseUserToDatabaseUser(firebaseUser) {
    if (!firebaseUser || !firebaseUser.email) {
      console.log("No Firebase user or email provided");
      return null;
    }

    console.log("Looking for user with email:", firebaseUser.email);
    console.log("Available database users:", this.databaseUsers);

    const databaseUser = this.databaseUsers.find(
      (user) => user.email.toLowerCase() === firebaseUser.email.toLowerCase()
    );

    console.log("Found database user:", databaseUser);
    return databaseUser || null;
  }

  // Get database user by Firebase user
  getDatabaseUser(firebaseUser) {
    return this.mapFirebaseUserToDatabaseUser(firebaseUser);
  }

  // Get all database users
  getDatabaseUsers() {
    return this.databaseUsers;
  }

  // Check if Firebase user has a corresponding database user
  hasDatabaseUser(firebaseUser) {
    return this.mapFirebaseUserToDatabaseUser(firebaseUser) !== null;
  }

  // Get user by email
  getUserByEmail(email) {
    return this.databaseUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Get user by ID
  getUserById(id) {
    return this.databaseUsers.find((user) => user.id === id);
  }
}

export default new UserMappingService();
