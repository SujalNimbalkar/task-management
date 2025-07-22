const { readDB, writeDB } = require("../utils/dbHelper");
const { readFormsDB } = require("../utils/formsDbHelper");

// Validate form data against form definition
function validateFormData(formData, formDefinition) {
  const errors = [];
  formDefinition.fields.forEach((field) => {
    if (field.required && !formData[field.id]) {
      errors.push(`${field.label} is required`);
    }

    if (formData[field.id]) {
      switch (field.type) {
        case "number":
          if (isNaN(formData[field.id])) {
            errors.push(`${field.label} must be a number`);
          }
          break;
        case "date":
          if (isNaN(Date.parse(formData[field.id]))) {
            errors.push(`${field.label} must be a valid date`);
          }
          break;
        case "select":
          if (field.options && !field.options.includes(formData[field.id])) {
            errors.push(
              `${field.label} must be one of: ${field.options.join(", ")}`
            );
          }
          break;
      }
    }
  });
  return errors;
}

// Find task in process structure
function findTask(db, taskId) {
  for (const process of db.processes) {
    // Check regular tasks
    if (process.tasks && !process.recurring) {
      const task = process.tasks.find((t) => String(t.id) === String(taskId));
      if (task) return { task, process };
    }

    // Check recurring tasks
    if (process.recurring) {
      // Check daily tasks
      if (process.recurring.daily) {
        for (const group of process.recurring.daily) {
          const task = group.tasks.find((t) => String(t.id) === String(taskId));
          if (task) return { task, process, group };
        }
      }
      // Check monthly tasks
      if (process.recurring.monthly) {
        for (const group of process.recurring.monthly) {
          const task = group.tasks.find((t) => String(t.id) === String(taskId));
          if (task) return { task, process, group };
        }
      }
    }
  }
  return null;
}

async function getTasks(req, res) {
  try {
    const userId = parseInt(req.query.userId, 10);
    const db = await readDB();
    const forms = await readFormsDB();
    const user = db.users.find((u) => u.id === userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    let allTasks = [];

    // Process regular tasks
    db.processes.forEach((process) => {
      if (process.tasks && !process.recurring) {
        const processTasks = process.tasks
          .filter((task) => {
            if (!user.roles.includes(task.assignedRole)) return false;
            if (!["pending", "in_progress", "reopened"].includes(task.status))
              return false;

            if (task.dependencies && task.dependencies.length > 0) {
              return task.dependencies.every((depId) => {
                const dep = process.tasks.find((t) => t.id === depId);
                return dep && dep.status === "completed";
              });
            }
            return true;
          })
          .map((task) => ({
            ...task,
            processName: process.name,
            form: task.formId ? forms[task.formId] : null,
          }));
        allTasks = [...allTasks, ...processTasks];
      }
    });

    // Process recurring tasks
    db.processes.forEach((process) => {
      if (process.recurring) {
        // Handle daily tasks
        if (process.recurring.daily) {
          process.recurring.daily.forEach((dailyGroup) => {
            if (user.roles.includes(dailyGroup.assignedRole)) {
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

        // Handle monthly tasks
        if (process.recurring.monthly) {
          process.recurring.monthly.forEach((monthlyGroup) => {
            if (user.roles.includes(monthlyGroup.assignedRole)) {
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
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}

async function submitTaskForm(req, res) {
  try {
    const taskId = req.params.id;
    const formData = req.body;
    const db = await readDB();
    const forms = await readFormsDB();

    // Find the task
    const found = findTask(db, taskId);
    if (!found) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { task } = found;

    // Check if task has a form
    if (!task.formId) {
      return res.status(400).json({ error: "Task does not require a form" });
    }

    // Get form definition
    const formDefinition = forms[task.formId];
    if (!formDefinition) {
      return res.status(400).json({ error: "Form definition not found" });
    }

    // Validate form data
    const validationErrors = validateFormData(formData, formDefinition);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Form validation failed",
        details: validationErrors,
      });
    }

    // Update task with form data
    task.formData = formData;
    await writeDB(db);

    res.json({ success: true, task });
  } catch (error) {
    console.error("Error in submitTaskForm:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}

async function completeTask(req, res) {
  try {
    const taskId = req.params.id;
    const db = await readDB();

    const found = findTask(db, taskId);
    if (!found) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { task } = found;

    // Check if task has a form and if it's filled
    if (task.formId && !task.formData) {
      return res.status(400).json({
        error: "Cannot complete task",
        details: "Required form has not been filled",
      });
    }

    task.status = "completed";
    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error("Error in completeTask:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const db = await readDB();

    const found = findTask(db, taskId);
    if (!found) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { task } = found;
    task.status = "reopened";
    // Clear form data when task is reopened
    if (task.formId) {
      task.formData = null;
    }

    await writeDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error("Error in updateTask:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}

module.exports = {
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
};
