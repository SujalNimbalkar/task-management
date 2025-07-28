const { readDB, writeDB } = require("../utils/dbHelper");
const { readFormsDB, writeFormsDB } = require("../utils/formsDbHelper");
const {
  validateFormData,
  analyzeFormDataAndTriggerTasks,
  triggerDependentTasks,
  checkConditionalTrigger,
  getLatestFormDataForTask,
} = require("../services/taskTriggers");
const XLSX = require("xlsx");

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

    for (const process of db.processes) {
      // Handle tasks array (new structure)
      if (process.tasks) {
        const processTasks = [];
        for (const task of process.tasks) {
          // Check if user has the required role
          if (!userRoles.has(task.assignedRole)) continue;

          // Check dependencies - all dependencies must be completed
          if (task.dependencies && task.dependencies.length > 0) {
            const dependenciesMet = task.dependencies.every((depId) => {
              const depTask = process.tasks.find((t) => t.id === depId);
              return depTask && depTask.status === "completed";
            });

            if (!dependenciesMet) continue;
          }

          // Check conditional triggers based on form data
          if (task.trigger && task.trigger.event) {
            const shouldShow = await checkConditionalTrigger(task, process);
            if (!shouldShow) continue;
          }

          // Assign recurrence if trigger is time-based
          let recurrence = undefined;
          let timeOfDay = undefined;
          let dayOfMonth = undefined;
          if (task.trigger && task.trigger.type === "time") {
            if (task.trigger.recurrence === "daily") {
              recurrence = "daily";
              timeOfDay = task.trigger.timeOfDay;
            } else if (task.trigger.recurrence === "weekly") {
              recurrence = "weekly";
              // Optionally add more weekly info here
            } else if (task.trigger.recurrence === "monthly") {
              recurrence = "monthly";
              dayOfMonth = task.trigger.dayOfMonth;
            }
          }

          processTasks.push({
            ...task,
            processName: process.name,
            recurrence,
            timeOfDay,
            dayOfMonth,
            form: task.formId ? db.forms[task.formId] : null,
          });
        }
        allTasks = [...allTasks, ...processTasks];
      }

      // Recurring tasks
      if (process.recurring) {
        // Daily tasks
        if (process.recurring.daily) {
          for (const dailyGroup of process.recurring.daily) {
            if (userRoles.has(dailyGroup.assignedRole)) {
              const tasks = dailyGroup.tasks.map((task) => ({
                ...task,
                processName: process.name,
                groupName: dailyGroup.name,
                recurrence: "daily",
                timeOfDay: dailyGroup.trigger.timeOfDay,
                form: task.formId ? db.forms[task.formId] : null,
              }));
              allTasks = [...allTasks, ...tasks];
            }
          }
        }
        // Weekly tasks
        if (process.recurring.weekly) {
          for (const weeklyGroup of process.recurring.weekly) {
            if (userRoles.has(weeklyGroup.assignedRole)) {
              const tasks = weeklyGroup.tasks.map((task) => ({
                ...task,
                processName: process.name,
                groupName: weeklyGroup.name,
                recurrence: "weekly",
                // Add more weekly info if needed
                form: task.formId ? db.forms[task.formId] : null,
              }));
              allTasks = [...allTasks, ...tasks];
            }
          }
        }
        // Monthly tasks
        if (process.recurring.monthly) {
          for (const monthlyGroup of process.recurring.monthly) {
            if (userRoles.has(monthlyGroup.assignedRole)) {
              const tasks = monthlyGroup.tasks.map((task) => ({
                ...task,
                processName: process.name,
                groupName: monthlyGroup.name,
                recurrence: "monthly",
                dayOfMonth: monthlyGroup.trigger.dayOfMonth,
                form: task.formId ? db.forms[task.formId] : null,
              }));
              allTasks = [...allTasks, ...tasks];
            }
          }
        }
      }
    }

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
    const formsDb = await readFormsDB();
    const { task, process } = findTask(db, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "completed";
    task.lastUpdated = new Date().toISOString();

    // Trigger dependent tasks when a task is completed
    if (process) {
      await triggerDependentTasks(process, task, db, formsDb);
    }

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
    task.lastUpdated = new Date().toISOString();
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
    const formsDb = await readFormsDB();
    // Find the task and process
    const { task, process } = findTask(db, taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    // Check if the task has a form
    if (!task.formId) {
      return res.status(400).json({ error: "Task does not have a form" });
    }
    // Get form definition
    const formDefinition = db.forms[task.formId];
    if (!formDefinition) {
      return res.status(400).json({ error: "Form definition not found" });
    }
    // Validate form data
    const validation = validateFormData(formData, formDefinition);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.message });
    }
    // Create form submission record
    const submission = {
      id: Date.now().toString(),
      taskId: String(taskId),
      formId: task.formId,
      submittedAt: new Date().toISOString(),
      formData: formData,
    };
    // Save to forms database
    formsDb.submissions.push(submission);
    // Update task status to completed and store form data
    task.status = "completed";
    task.formData = formData;
    task.lastUpdated = new Date().toISOString();
    // Unified trigger logic: update dependent tasks
    if (process) {
      await triggerDependentTasks(process, task, db, formsDb);
    }
    // Write both DBs
    await Promise.all([writeFormsDB(formsDb), writeDB(db)]);
    res.json({ success: true, submission, task });
  } catch (error) {
    console.error("Error in submitTaskForm:", error);
    res.status(500).json({ error: "Failed to submit form" });
  }
};

const getFormSubmissions = async (req, res) => {
  try {
    const taskId = req.params.id;
    const formsDb = await readFormsDB();

    const submissions = formsDb.submissions.filter(
      (submission) => submission.taskId === String(taskId)
    );
    res.json(submissions);
  } catch (error) {
    console.error("Error in getFormSubmissions:", error);
    res.status(500).json({ error: "Failed to fetch form submissions" });
  }
};

const getAllFormSubmissionsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const db = await readDB();
    const formsDb = await readFormsDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const userRoles = new Set(user.roles);

    // Build a map of taskId -> { assignedRole, name, formId }
    const taskMap = {};
    for (const process of db.processes) {
      if (process.tasks) {
        for (const task of process.tasks) {
          taskMap[task.id] = {
            assignedRole: task.assignedRole,
            name: task.name,
            formId: task.formId,
          };
        }
      }
      if (process.recurring) {
        for (const groupArr of Object.values(process.recurring)) {
          for (const group of groupArr) {
            for (const task of group.tasks) {
              taskMap[task.id] = {
                assignedRole: group.assignedRole,
                name: task.name,
                formId: task.formId,
              };
            }
          }
        }
      }
    }

    // Filter submissions by user roles
    const userSubmissions = formsDb.submissions
      .filter((submission) => {
        const task = taskMap[parseInt(submission.taskId, 10)];
        return task && userRoles.has(task.assignedRole);
      })
      .map((submission) => {
        const task = taskMap[parseInt(submission.taskId, 10)];
        const formName = db.forms[submission.formId]?.name || submission.formId;
        return {
          ...submission,
          taskName: task?.name,
          formName,
        };
      });

    res.json(userSubmissions);
  } catch (error) {
    console.error("Error in getAllFormSubmissionsForUser:", error);
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
};

const triggerEvent = async (req, res) => {
  try {
    const { eventType, taskId, data } = req.body;
    const db = await readDB();

    // Find the task that triggered the event
    const { task, process } = findTask(db, taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    let triggeredTasks = [];

    // Handle different event types
    switch (eventType) {
      case "production_target_below_85":
        // Check if production target is below 85%
        if (data && data.actual_production && data.production_target) {
          const achievementPercentage =
            (data.actual_production / data.production_target) * 100;
          if (achievementPercentage < 85) {
            // Trigger action plan task
            const actionPlanTask = process.tasks.find(
              (t) =>
                t.trigger && t.trigger.event === "production_target_below_85"
            );
            if (actionPlanTask) {
              actionPlanTask.status = "pending";
              triggeredTasks.push(actionPlanTask.id);
            }
          }
        }
        break;

      case "material_not_received":
        // Trigger production plan adjustment
        const adjustmentTask = process.tasks.find(
          (t) => t.trigger && t.trigger.event === "material_not_received"
        );
        if (adjustmentTask) {
          adjustmentTask.status = "pending";
          triggeredTasks.push(adjustmentTask.id);
        }
        break;

      case "emergency_situation":
        // Trigger contingency plan activation and related tasks
        const contingencyTask = process.tasks.find(
          (t) => t.trigger && t.trigger.event === "emergency_situation"
        );
        if (contingencyTask) {
          contingencyTask.status = "pending";
          triggeredTasks.push(contingencyTask.id);
        }
        break;

      case "manual_trigger":
        // Manually trigger a specific task based on form data analysis
        if (data && data.taskId) {
          const targetTask = process.tasks.find((t) => t.id === data.taskId);
          if (targetTask) {
            targetTask.status = "pending";
            triggeredTasks.push(targetTask.id);
          }
        }
        break;

      case "check_task_301_trigger":
        // Manually check and trigger task 302 based on task 301 data
        console.log("Manually checking task 301 trigger conditions");
        const task301 = process.tasks.find((t) => t.id === 301);
        if (task301 && task301.status === "completed") {
          const latestFormData = await getLatestFormDataForTask(301);
          if (latestFormData) {
            const actualProduction = parseFloat(
              latestFormData.actual_production
            );
            const productionTarget = parseFloat(
              latestFormData.production_target
            );

            if (!isNaN(actualProduction) && !isNaN(productionTarget)) {
              const achievementPercentage =
                (actualProduction / productionTarget) * 100;
              console.log(
                `Achievement Percentage: ${achievementPercentage.toFixed(1)}%`
              );

              if (achievementPercentage < 85) {
                const actionPlanTask = process.tasks.find((t) => t.id === 302);
                if (actionPlanTask) {
                  actionPlanTask.status = "pending";
                  triggeredTasks.push(actionPlanTask.id);
                  console.log("Action Plan task (302) manually triggered");
                }
              }
            }
          }
        }
        break;

      default:
        return res.status(400).json({ error: "Unknown event type" });
    }

    await writeDB(db);
    res.json({
      success: true,
      message: `Event ${eventType} triggered successfully`,
      triggeredTasks: triggeredTasks,
    });
  } catch (error) {
    console.error("Error in triggerEvent:", error);
    res.status(500).json({ error: "Failed to trigger event" });
  }
};

const exportTaskToExcel = async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`[EXCEL EXPORT] Attempting to export task ${taskId}`);

    const db = await readDB();
    const formsDb = await readFormsDB();

    // Find the task and process
    const { task, process } = findTask(db, taskId);
    if (!task) {
      console.log(`[EXCEL EXPORT] Task ${taskId} not found`);
      return res.status(404).json({ error: "Task not found" });
    }

    console.log(
      `[EXCEL EXPORT] Found task: ${task.name}, formId: ${task.formId}`
    );

    // Get form definition
    const formDefinition = db.forms[task.formId];
    if (!formDefinition) {
      console.log(
        `[EXCEL EXPORT] Form definition not found for formId: ${task.formId}`
      );
      return res.status(400).json({ error: "Form definition not found" });
    }

    console.log(`[EXCEL EXPORT] Found form definition: ${formDefinition.name}`);

    // Get form data - first try submissions, then fall back to task's formData
    let formData = null;
    const submissions = formsDb.submissions.filter(
      (s) => String(s.taskId) === String(taskId)
    );

    if (submissions.length > 0) {
      // Sort by submission date and get the latest
      submissions.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      const latestSubmission = submissions[0];
      formData = latestSubmission.formData;
    } else if (task.formData) {
      // Fall back to task's formData if no submissions exist
      formData = task.formData;
    }

    if (!formData) {
      console.log(`[EXCEL EXPORT] No form data found for task ${taskId}`);
      return res
        .status(404)
        .json({ error: "No form data found for this task" });
    }

    console.log(
      `[EXCEL EXPORT] Found form data with ${
        formData.rows ? formData.rows.length : 0
      } rows`
    );

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = [];

    // Add header fields
    if (formDefinition.fields) {
      const headerRow = {};
      formDefinition.fields.forEach((field) => {
        if (formData[field.id]) {
          headerRow[field.label] = formData[field.id];
        }
      });
      if (Object.keys(headerRow).length > 0) {
        excelData.push(headerRow);
        excelData.push({}); // Empty row for spacing
      }
    }

    // Add table data
    if (formData.rows && Array.isArray(formData.rows)) {
      // Add headers for table fields
      if (formDefinition.tableFields && formDefinition.tableFields.length > 0) {
        const tableHeaders = {};
        formDefinition.tableFields.forEach((field) => {
          tableHeaders[field.label] = field.label;
        });
        excelData.push(tableHeaders);
      }

      // Add table rows
      formData.rows.forEach((row) => {
        const excelRow = {};
        if (formDefinition.tableFields) {
          formDefinition.tableFields.forEach((field) => {
            excelRow[field.label] = row[field.id] || "";
          });
        }
        excelData.push(excelRow);
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [];
    if (excelData.length > 0) {
      const firstRow = excelData[0];
      Object.keys(firstRow).forEach((key) => {
        columnWidths.push({ wch: Math.max(key.length, 15) });
      });
    }
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook - truncate name to 31 chars for Excel compatibility
    const sheetName =
      task.name.length > 31 ? task.name.substring(0, 31) : task.name;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${task.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx"`
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("Error in exportTaskToExcel:", error);
    res.status(500).json({ error: "Failed to export task to Excel" });
  }
};

module.exports = {
  getUsers,
  getTasks,
  completeTask,
  updateTask,
  submitTaskForm,
  getFormSubmissions,
  getAllFormSubmissionsForUser,
  triggerEvent,
  exportTaskToExcel,
};
