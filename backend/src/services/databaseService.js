const User = require("../models/User");
const { FormDefinition, FormSubmission } = require("../models/Form");
const Process = require("../models/Process");
const { readAllData, writeAllData } = require("../utils/modularDbHelper");

class DatabaseService {
  constructor() {
    this.useMongoDB = process.env.USE_MONGODB === "true";
    this.isInitialized = false;
  }

  // Initialize the database service
  async initialize() {
    if (this.isInitialized) return;

    if (this.useMongoDB) {
      console.log("🔄 Using MongoDB database");
      // MongoDB is already connected via the config
    } else {
      console.log("🔄 Using JSON file database");
    }

    this.isInitialized = true;
  }

  // User operations
  async getUsers() {
    await this.initialize();

    if (this.useMongoDB) {
      return await User.find().sort({ createdAt: 1 });
    } else {
      const data = await readAllData();
      return data.users || [];
    }
  }

  async getUserById(id) {
    await this.initialize();

    if (this.useMongoDB) {
      return await User.findById(id);
    } else {
      const users = await this.getUsers();
      return users.find((user) => user.id === parseInt(id));
    }
  }

  async getUserByEmail(email) {
    await this.initialize();

    if (this.useMongoDB) {
      return await User.findOne({ email: email.toLowerCase() });
    } else {
      const users = await this.getUsers();
      return users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase()
      );
    }
  }

  async createUser(userData) {
    await this.initialize();

    if (this.useMongoDB) {
      const user = new User(userData);
      return await user.save();
    } else {
      const users = await this.getUsers();
      const newId =
        users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const newUser = { id: newId, ...userData };
      users.push(newUser);
      await this.updateUsers(users);
      return newUser;
    }
  }

  async updateUser(id, updateData) {
    await this.initialize();

    if (this.useMongoDB) {
      return await User.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const users = await this.getUsers();
      const index = users.findIndex((user) => user.id === parseInt(id));
      if (index !== -1) {
        users[index] = { ...users[index], ...updateData };
        await this.updateUsers(users);
        return users[index];
      }
      return null;
    }
  }

  async deleteUser(id) {
    await this.initialize();

    if (this.useMongoDB) {
      return await User.findByIdAndDelete(id);
    } else {
      const users = await this.getUsers();
      const filteredUsers = users.filter((user) => user.id !== parseInt(id));
      await this.updateUsers(filteredUsers);
      return true;
    }
  }

  // Form operations
  async getFormDefinitions() {
    await this.initialize();

    if (this.useMongoDB) {
      return await FormDefinition.find().sort({ createdAt: 1 });
    } else {
      const data = await readAllData();
      return Object.values(data.forms || {}).filter(
        (form) => form.isActive !== false
      );
    }
  }

  async getFormDefinitionById(formId) {
    await this.initialize();

    if (this.useMongoDB) {
      return await FormDefinition.findByFormId(formId);
    } else {
      const data = await readAllData();
      return data.forms?.[formId] || null;
    }
  }

  async createFormDefinition(formData) {
    await this.initialize();

    if (this.useMongoDB) {
      const form = new FormDefinition(formData);
      return await form.save();
    } else {
      const data = await readAllData();
      data.forms = data.forms || {};
      data.forms[formData.formId] = formData;
      await writeAllData(data);
      return formData;
    }
  }

  async updateFormDefinition(formId, updateData) {
    await this.initialize();

    if (this.useMongoDB) {
      return await FormDefinition.findOneAndUpdate({ formId }, updateData, {
        new: true,
      });
    } else {
      const data = await readAllData();
      if (data.forms?.[formId]) {
        data.forms[formId] = { ...data.forms[formId], ...updateData };
        await writeAllData(data);
        return data.forms[formId];
      }
      return null;
    }
  }

  // Form submission operations
  async getFormSubmissions(filters = {}) {
    await this.initialize();

    if (this.useMongoDB) {
      let query = FormSubmission.find();
      if (filters.taskId) query = query.where("taskId", filters.taskId);
      if (filters.formId) query = query.where("formId", filters.formId);
      if (filters.status) query = query.where("status", filters.status);
      return await query
        .populate("submittedBy", "name email")
        .sort({ submittedAt: -1 });
    } else {
      const data = await readAllData();
      let submissions = data.forms?.submissions || [];

      if (filters.taskId) {
        submissions = submissions.filter(
          (sub) => sub.taskId === filters.taskId
        );
      }
      if (filters.formId) {
        submissions = submissions.filter(
          (sub) => sub.formId === filters.formId
        );
      }
      if (filters.status) {
        submissions = submissions.filter(
          (sub) => sub.status === filters.status
        );
      }

      return submissions;
    }
  }

  async createFormSubmission(submissionData) {
    await this.initialize();

    if (this.useMongoDB) {
      const submission = new FormSubmission(submissionData);
      return await submission.save();
    } else {
      const data = await readAllData();
      data.forms = data.forms || {};
      data.forms.submissions = data.forms.submissions || [];
      data.forms.submissions.push(submissionData);
      await writeAllData(data);
      return submissionData;
    }
  }

  // Process operations
  async getProcesses() {
    await this.initialize();

    if (this.useMongoDB) {
      return await Process.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: 1 });
    } else {
      const data = await readAllData();
      return data.processes || [];
    }
  }

  async getProcessById(id) {
    await this.initialize();

    if (this.useMongoDB) {
      return await Process.findById(id).populate("createdBy", "name email");
    } else {
      const processes = await this.getProcesses();
      return processes.find((process) => process.id === parseInt(id));
    }
  }

  async createProcess(processData) {
    await this.initialize();

    if (this.useMongoDB) {
      const process = new Process(processData);
      return await process.save();
    } else {
      const processes = await this.getProcesses();
      const newId =
        processes.length > 0 ? Math.max(...processes.map((p) => p.id)) + 1 : 1;
      const newProcess = { id: newId, ...processData };
      processes.push(newProcess);
      await this.updateProcesses(processes);
      return newProcess;
    }
  }

  async updateProcess(id, updateData) {
    await this.initialize();

    if (this.useMongoDB) {
      return await Process.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const processes = await this.getProcesses();
      const index = processes.findIndex(
        (process) => process.id === parseInt(id)
      );
      if (index !== -1) {
        processes[index] = { ...processes[index], ...updateData };
        await this.updateProcesses(processes);
        return processes[index];
      }
      return null;
    }
  }

  async deleteProcess(id) {
    await this.initialize();

    if (this.useMongoDB) {
      return await Process.findByIdAndDelete(id);
    } else {
      const processes = await this.getProcesses();
      const filteredProcesses = processes.filter((process) => process.id !== parseInt(id));
      await this.updateProcesses(filteredProcesses);
      return true;
    }
  }

  // Helper methods for JSON file operations
  async updateUsers(users) {
    if (!this.useMongoDB) {
      const data = await readAllData();
      data.users = users;
      await writeAllData(data);
    }
  }

  async updateProcesses(processes) {
    if (!this.useMongoDB) {
      const data = await readAllData();
      data.processes = processes;
      await writeAllData(data);
    }
  }

  // Migration helper
  async migrateFromJsonToMongo() {
    if (!this.useMongoDB) {
      console.log("❌ Cannot migrate: MongoDB not enabled");
      return false;
    }

    try {
      console.log("🔄 Starting migration from JSON to MongoDB...");

      const data = await readAllData();

      // Migrate users
      if (data.users && data.users.length > 0) {
        console.log(`📦 Migrating ${data.users.length} users...`);
        for (const user of data.users) {
          const { id, ...userData } = user;
          try {
            await User.findOneAndUpdate({ email: userData.email }, userData, {
              upsert: true,
              new: true,
            });
            console.log(
              `  ✅ Migrated user: ${userData.name} (${userData.email})`
            );
          } catch (error) {
            console.log(
              `  ⚠️  Skipped duplicate user: ${userData.name} (${userData.email})`
            );
          }
        }
      }

      // Migrate form definitions
      if (data.forms) {
        console.log("📦 Migrating form definitions...");
        for (const [formId, formData] of Object.entries(data.forms)) {
          if (formId !== "submissions") {
            try {
              await FormDefinition.findOneAndUpdate({ formId }, formData, {
                upsert: true,
                new: true,
              });
              console.log(`  ✅ Migrated form: ${formData.name || formId}`);
            } catch (error) {
              console.log(`  ⚠️  Skipped form: ${formData.name || formId}`);
            }
          }
        }
      }

      // Migrate form submissions
      if (data.forms?.submissions) {
        console.log(
          `📦 Migrating ${data.forms.submissions.length} form submissions...`
        );
        for (const submission of data.forms.submissions) {
          try {
            await FormSubmission.findOneAndUpdate(
              { id: submission.id },
              submission,
              { upsert: true, new: true }
            );
          } catch (error) {
            console.log(`  ⚠️  Skipped submission: ${submission.id}`);
          }
        }
      }

      // Migrate processes
      if (data.processes && data.processes.length > 0) {
        console.log(`📦 Migrating ${data.processes.length} processes...`);
        for (const process of data.processes) {
          const { id, ...processData } = process;
          try {
            await Process.findOneAndUpdate(
              { name: processData.name },
              processData,
              { upsert: true, new: true }
            );
            console.log(`  ✅ Migrated process: ${processData.name}`);
          } catch (error) {
            console.log(`  ⚠️  Skipped process: ${processData.name}`);
          }
        }
      }

      console.log("✅ Migration completed successfully!");
      return true;
    } catch (error) {
      console.error("❌ Migration failed:", error);
      return false;
    }
  }

  // Get database type
  getDatabaseType() {
    return this.useMongoDB ? "MongoDB" : "JSON Files";
  }

  // Check if MongoDB is enabled
  isMongoDBEnabled() {
    return this.useMongoDB;
  }
}

module.exports = new DatabaseService();
