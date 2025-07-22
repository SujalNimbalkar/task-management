const { readDB, writeDB } = require("../utils/dbHelper");
const { readFormsDB } = require("../utils/formsDbHelper");

// Validate form data against form definition
function validateFormData(formData, formDefinition) {
  for (const field of formDefinition.fields) {
    if (field.required && !formData[field.id]) {
      return {
        isValid: false,
        message: `Field '${field.label}' is required.`,
      };
    }
  }
  return { isValid: true };
}

// Find a task by its ID across all processes
function findTask(db, taskId) {
  for (const process of db.processes) {
    if (process.tasks) {
      const task = process.tasks.find((t) => String(t.id) === String(taskId));
      if (task) return { task, process };
    }
    if (process.recurring) {
      for (const group of Object.values(process.recurring).flat()) {
        const task = group.tasks.find((t) => String(t.id) === String(taskId));
        if (task) return { task, process, group };
      }
    }
  }
  return { task: null, process: null, group: null };
}

const getUsers = async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.users);
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    const db = await readDB();
    const forms = await readFormsDB();
    const user = db.users.find((u) => u.id === userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let allTasks = [];
    const userRoles = new Set(user.roles);

    db.processes.forEach((process) => {
      // Non-recurring tasks
      if (process.tasks) {
        const processTasks = process.tasks
          .filter((task) => userRoles.has(task.assignedRole))
          .map((task) => ({
            ...task,
            processName: process.name,
            form: task.formId ? forms[task.formId] : null,
          }));
        allTasks = [...allTasks, ...processTasks];
      }

      // Recurring tasks
      if (process.recurring) {
        // Daily tasks
        if (process.recurring.daily) {
          process.recurring.daily.forEach((dailyGroup) => {
            if (userRoles.has(dailyGroup.assignedRole)) {
              const tasks = dailyGroup.tasks.map((task) => ({
                ...task,
                processName: process.name,
                groupName: dailyGroup.name,
                recurrence: "daily",
                timeOfDay: dailyGroup.trigger.timeOfDay,
                form: task.formId ? forms[task.formId] : null,
              }));
              allTasks = [...allTasks, ...tasks];
            }
          });
        }
        // Monthly tasks
        if (process.recurring.monthly) {
          process.recurring.monthly.forEach((monthlyGroup) => {
            if (userRoles.has(monthlyGroup.assignedRole)) {
              const tasks = monthlyGroup.tasks.map((task) => ({
                ...task,
                processName: process.name,
                groupName: monthlyGroup.name,
                recurrence: "monthly",
                dayOfMonth: monthlyGroup.trigger.dayOfMonth,
                form: task.formId ? forms[task.formId] : null,
              }));
              allTasks = [...allTasks, ...tasks];
            }
          });
        }
      }
    });

    res.json(allTasks);
  } catch (error) {
    console.error("Error in getTasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

const completeTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const db = await readDB();
    const { task } = findTask(db, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "completed";
    await writeDB(db);
    res.json(task);
  } catch (error) {
    console.error("Error in completeTask:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const db = await readDB();
    const { task } = findTask(db, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "reopened";
    await writeDB(db);
    res.json(task);
  } catch (error) {
    console.error("Error in updateTask:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

const submitTaskForm = async (req, res) => {
  try {
    const taskId = req.params.id;
    const formData = req.body;
    const db = await readDB();
    const forms = await readFormsDB();

    // Find the task
    const { task } = findTask(db, taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if the task has a form
    if (!task.formId) {
      return res.status(400).json({ error: "Task does not have a form" });
    }

    // Get form definition
    const formDefinition = forms[task.formId];
    if (!formDefinition) {
      return res.status(400).json({ error: "Form definition not found" });
    }

    // Validate form data
    const validation = validateFormData(formData, formDefinition);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.message });
    }

    // Update task with form data and set status to completed
    task.formData = formData;
    task.status = "completed";

    await writeDB(db);
    res.json(task);
  } catch (error) {
    console.error("Error in submitTaskForm:", error);
    res.status(500).json({ error: "Failed to submit form" });
  }
};

module.exports = {
  getUsers,
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
};
