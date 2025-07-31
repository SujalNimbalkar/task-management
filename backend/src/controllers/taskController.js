const databaseService = require("../services/databaseService");
const {
  validateFormData,
  analyzeFormDataAndTriggerTasks,
} = require("../services/taskTriggers");
const Process = require("../models/Process");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

// Find a task by its ID across all processes
function findTask(processes, taskId) {
  for (const process of processes) {
    if (process.tasks) {
      const task = process.tasks.find(
        (t) => String(t.taskId) === String(taskId)
      );
      if (task) return { task, process };
    }
  }
  return { task: null, process: null };
}

const getUsers = async (req, res) => {
  try {
    const users = await databaseService.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error in getUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.query.userId;

    // Get user from MongoDB
    const user = await databaseService.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get all processes from MongoDB
    const processes = await databaseService.getProcesses();

    // Get all form definitions for mapping
    const formDefinitions = await databaseService.getFormDefinitions();
    const formMap = {};
    formDefinitions.forEach((form) => {
      if (form.formId) {
        formMap[form.formId] = form;
      }
    });

    let allTasks = [];
    const userRoles = new Set(user.roles);
    const isAdmin = userRoles.has("admin");

    for (const process of processes) {
      if (process.tasks) {
        for (const task of process.tasks) {
          // Check if user has the required role OR if task is specifically assigned to this user
          const hasRequiredRole = userRoles.has(task.assignedRole);
          const isAssignedToUser =
            task.assignedUserId && task.assignedUserId.toString() === userId;

          // Allow Plant Head to see only submitted daily tasks (with formData) for approval
          const isPlantHeadDailyTask =
            userRoles.has("plant_head") &&
            task.name &&
            task.name.includes("Daily Production Plan") &&
            task.status === "in_process" &&
            task.formData; // Only show tasks that have been submitted (have formData)

          if (
            !hasRequiredRole &&
            !isAssignedToUser &&
            !isPlantHeadDailyTask &&
            !isAdmin
          ) {
            continue;
          }

          // Check dependencies - all dependencies must be completed (skip for admin users)
          if (task.dependencies && task.dependencies.length > 0 && !isAdmin) {
            const dependenciesMet = task.dependencies.every((depId) => {
              const depTask = process.tasks.find((t) => t.taskId === depId);
              return depTask && depTask.status === "completed";
            });

            if (!dependenciesMet) continue;
          }

          // Get form information if formId exists
          const formInfo = task.formId ? formMap[task.formId] : null;

          // Create task object with process information
          const taskWithProcess = {
            ...task,
            id: task.taskId, // Frontend expects 'id' field
            taskId: task.taskId, // Ensure taskId is also available
            processId: process._id,
            processName: process.name,
            processCategory: process.category,
            dueDate: task.dueDate || null,
            lastUpdated: task.lastUpdated || null,
            isTemplate: task.isTemplate || false,
            templateId: task.templateId || null,
            formData: task.formData || null,
            recurrence: task.trigger?.recurrence || null,
            timeOfDay: task.trigger?.timeOfDay || null,
            dayOfMonth: task.trigger?.dayOfMonth || null,
            // Add missing fields that frontend expects
            name: task.name || "",
            // For Plant Head, show in_process daily tasks as pending for approval
            status:
              userRoles.has("plant_head") &&
              task.name &&
              task.name.includes("Daily Production Plan") &&
              task.status === "in_process"
                ? "pending"
                : task.status || "pending",
            assignedRole: task.assignedRole || "",
            assignedUserId: task.assignedUserId || null,
            dependencies: task.dependencies || [],
            formId: task.formId || null,
            trigger: task.trigger || null,
            dueDateRule: task.dueDateRule || null,
            // Ensure all required fields are present
            createdForMonth: task.createdForMonth || "",
            weekNumber: task.weekNumber || null,
            dayNumber: task.dayNumber || null,
            // Add form information
            form: formInfo
              ? {
                  _id: formInfo._id,
                  formId: formInfo.formId,
                  name: formInfo.name,
                  type: formInfo.type,
                  fields: formInfo.fields,
                  tableFields: formInfo.tableFields,
                }
              : null,
          };

          allTasks.push(taskWithProcess);
        }
      }
    }

    // Sort tasks by due date and status
    allTasks.sort((a, b) => {
      // Completed tasks go last
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;

      // Sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      return 0;
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
    // const db = await readDB();
    // const formsDb = await readFormsDB();
    const { task, process } = findTask(db, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "completed";
    task.lastUpdated = new Date().toISOString();

    // Trigger dependent tasks when a task is completed
    if (process) {
      await triggerDependentTasks(process, task, db, formsDb);
    }

    // After marking a weekly plan as completed, create daily tasks for that week
    if (
      task.name &&
      task.name.includes("Weekly Production Plan") &&
      task.status === "completed"
    ) {
      const weekNumberMatch = task.name.match(/Week (\d+)/);
      const weekNumber = weekNumberMatch
        ? parseInt(weekNumberMatch[1], 10)
        : null;
      const daysInWeek = 6; // Assuming 6 working days per week
      const createdForMonth = task.createdForMonth || "";
      const monthNameMatch = task.name.match(/- ([A-Za-z]+) (\d{4})/);
      const monthName = monthNameMatch ? monthNameMatch[1] : "";
      const year = monthNameMatch ? monthNameMatch[2] : "";
      const baseId = Date.now();
      for (let day = 1; day <= daysInWeek; day++) {
        const dailyTaskId = baseId + day;
        const dailyTask = {
          id: dailyTaskId,
          name: `Daily Production Plan - Week ${weekNumber} Day ${day} - ${monthName} ${year}`,
          assignedRole: "production_manager",
          assignedUserId: null, // Will be assigned based on role
          status: "pending",
          dependencies: [task.id],
          formId: "F-DAILY-PRODUCTION-ENTRY",
          trigger: {
            type: "event",
            event: "task_completed",
            taskId: task.id,
          },
          formData: null,
          lastUpdated: new Date().toISOString(),
          createdForMonth: createdForMonth,
        };
        process.tasks.push(dailyTask);
        console.log(
          `[COMPLETE] Created daily task ${dailyTaskId} for Week ${weekNumber} Day ${day}`
        );
      }
      await writeDB(db);
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
    // const db = await readDB();
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
    console.log("=== SUBMIT FORM DEBUG ===");
    const taskId = req.params.id;
    const formData = req.body;
    console.log("Task ID:", taskId);
    console.log("Form Data:", JSON.stringify(formData, null, 2));

    // Use database service for MongoDB operations

    // Find the task and process using MongoDB
    const processes = await databaseService.getProcesses();
    const { task, process } = findTask(processes, taskId);
    console.log("Found task:", task ? task.name : "NOT FOUND");
    console.log("Found process:", process ? process.name : "NOT FOUND");

    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if the task has a form
    if (!task.formId) {
      console.log("❌ Task does not have a form");
      return res.status(400).json({ error: "Task does not have a form" });
    }

    console.log("Task formId:", task.formId);

    // Get form definition from MongoDB
    const formDefinition = await databaseService.getFormDefinitionById(
      task.formId
    );
    console.log("Form definition found:", !!formDefinition);

    if (!formDefinition) {
      console.log("❌ Form definition not found");
      return res.status(400).json({ error: "Form definition not found" });
    }

    console.log("Form definition fields:", formDefinition.fields?.length || 0);

    // Create form submission record for MongoDB
    const submissionData = {
      taskId: String(taskId),
      formId: task.formId,
      submittedBy: req.body.submittedBy || "688b05ff8be0df0fdc385cb5", // Default user ID
      formData: formData,
    };

    // Save form submission to MongoDB
    const submission = await databaseService.createFormSubmission(
      submissionData
    );
    console.log("✅ Form submission saved to MongoDB");

    // Update task status based on task type
    console.log("🔍 Task name check:", task.name);
    console.log(
      "🔍 Contains 'Daily Production Plan':",
      task.name && task.name.includes("Daily Production Plan")
    );
    console.log(
      "🔍 Contains 'Monthly Production Plan':",
      task.name && task.name.includes("Monthly Production Plan")
    );

    if (task.name && task.name.includes("Daily Production Plan")) {
      // Daily Production Plan should be in_process for Production Manager
      // Plant Head will see it as pending for approval
      task.status = "in_process";
      console.log(
        "📋 Daily Production Plan submitted - status: in_process (Production Manager view)"
      );
    } else if (task.name && task.name.includes("Monthly Production Plan")) {
      // Monthly Production Plan is completed immediately
      task.status = "completed";
      console.log("📋 Monthly Production Plan completed");
    } else {
      // Other tasks are completed immediately
      task.status = "completed";
      console.log("📋 Task completed");
    }
    task.formData = formData;
    task.lastUpdated = new Date().toISOString();

    // Update the process in MongoDB
    if (process && process._id) {
      await Process.findByIdAndUpdate(process._id, { tasks: process.tasks });
      console.log("✅ Process updated in MongoDB");
    } else {
      console.log("⚠️ Skipping process update - process._id not available");
    }

    // If this is a monthly production plan, trigger weekly task creation and data population
    if (
      task.name &&
      task.name.includes("Monthly Production Plan") &&
      task.formData &&
      task.formData.rows &&
      Array.isArray(task.formData.rows) &&
      !task.isTemplate // Only trigger for non-template tasks
    ) {
      console.log(
        `[SUBMIT] Monthly plan submitted, triggering weekly task creation and data population...`
      );

      // Call the taskTriggers service to handle weekly task creation and data population
      await analyzeFormDataAndTriggerTasks(process, task, task.formData, null);

      // Update the process with any new/modified tasks
      if (process && process._id) {
        await Process.findByIdAndUpdate(process._id, { tasks: process.tasks });
        console.log("✅ Process updated with weekly tasks from taskTriggers");
      }
    }

    console.log("✅ Form submitted successfully");

    res.json({ success: true, submission, task });
  } catch (error) {
    console.error("❌ Error in submitTaskForm:", error);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to submit form", details: error.message });
  }
};

const getFormSubmissions = async (req, res) => {
  try {
    const taskId = req.params.id;
    // const formsDb = await readFormsDB();

    // const submissions = formsDb.submissions.filter(
    //   (submission) => submission.taskId === String(taskId)
    // );
    // res.json(submissions);
    res.status(501).json({ error: "Feature not implemented for MongoDB" });
  } catch (error) {
    console.error("Error in getFormSubmissions:", error);
    res.status(500).json({ error: "Failed to fetch form submissions" });
  }
};

const getAllFormSubmissionsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    // const db = await readDB();
    // const formsDb = await readFormsDB();
    // const user = db.users.find((u) => u.id === userId);
    // if (!user) return res.status(404).json({ error: "User not found" });
    // const userRoles = new Set(user.roles);

    // // Build a map of taskId -> { assignedRole, name, formId }
    // const taskMap = {};
    // for (const process of db.processes) {
    //   if (process.tasks) {
    //     for (const task of process.tasks) {
    //       taskMap[task.id] = {
    //         assignedRole: task.assignedRole,
    //         name: task.name,
    //         formId: task.formId,
    //       };
    //     }
    //   }
    //   if (process.recurring) {
    //     for (const groupArr of Object.values(process.recurring)) {
    //       for (const group of groupArr) {
    //         for (const task of group.tasks) {
    //           taskMap[task.id] = {
    //             assignedRole: group.assignedRole,
    //             name: task.name,
    //             formId: task.formId,
    //           };
    //         }
    //       }
    //     }
    //   }
    // }

    // // Filter submissions by user roles
    // const userSubmissions = formsDb.submissions
    //   .filter((submission) => {
    //     const task = taskMap[parseInt(submission.taskId, 10)];
    //     return task && userRoles.has(task.assignedRole);
    //   })
    //   .map((submission) => {
    //     const task = taskMap[parseInt(submission.taskId, 10)];
    //     const formName = formsDb[submission.formId]?.name || submission.formId;
    //     return {
    //       ...submission,
    //       taskName: task?.name,
    //       formName,
    //     };
    //   });

    // res.json(userSubmissions);
    res.status(501).json({ error: "Feature not implemented for MongoDB" });
  } catch (error) {
    console.error("Error in getAllFormSubmissionsForUser:", error);
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
};

const triggerEvent = async (req, res) => {
  try {
    const { eventType, taskId, data } = req.body;
    // const db = await readDB();

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

    // await writeDB(db);
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

    // const db = await readDB();
    // const formsDb = await readFormsDB();

    // Find the task and process
    const { task, process } = findTask(db, taskId);
    if (!task) {
      console.log(`[EXCEL EXPORT] Task ${taskId} not found`);
      return res.status(404).json({ error: "Task not found" });
    }

    console.log(
      `[EXCEL EXPORT] Found task: ${task.name}, formId: ${task.formId}`
    );

    // Get form definition from forms database
    const formDefinition = formsDb[task.formId];
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

    // Prepare data for Daily Production Report
    const excelData = [];

    // Add company header
    excelData.push(["BCPL"]);
    excelData.push([]);

    // Add report title
    excelData.push(["Daily Production Report of SMT line"]);
    excelData.push([]);

    // Add date and document details
    const reportDate = formData.date || new Date().toLocaleDateString("en-GB");
    excelData.push(["Date:", reportDate]);
    excelData.push(["Doc.No.- F-PROD-01"]);
    excelData.push(["REV.NO / DATE-00"]);
    excelData.push(["ISSUE DATE-01.4.24"]);
    excelData.push([]);

    // Add table headers for Daily Production Report
    const headers = [
      "DEPT. NAME",
      "OPERATOR NAME",
      "WORK",
      "H1 PLAN",
      "H1 ACTUAL",
      "H2 PLAN",
      "H2 ACTUAL",
      "OT PLAN",
      "OT ACTUAL",
      "QUALITY DEFECTS",
      "DEFECT DETAILS",
      "RESPONSIBLE PERSON",
      "TARGET QTY",
      "ACTUAL PROD.",
      "PRODUCTION %",
      "ERP STATUS",
      "REASON",
      "OVERALL %",
      "REWORK",
    ];
    excelData.push(headers);

    // Add table data
    if (formData.rows && Array.isArray(formData.rows)) {
      let totalTargetQty = 0;
      let totalActualProd = 0;

      formData.rows.forEach((row) => {
        const targetQty = parseFloat(row.target_qty) || 0;
        const actualProd = parseFloat(row.actual_production) || 0;
        const h1Plan = parseFloat(row.h1_plan) || 0;
        const h1Actual = parseFloat(row.h1_actual) || 0;
        const h2Plan = parseFloat(row.h2_plan) || 0;
        const h2Actual = parseFloat(row.h2_actual) || 0;
        const otPlan = parseFloat(row.ot_plan) || 0;
        const otActual = parseFloat(row.ot_actual) || 0;

        // Calculate production percentage
        let productionPercent = 0;
        if (targetQty > 0) {
          productionPercent = (actualProd / targetQty) * 100;
        }

        const dataRow = [
          row.dept_name || "",
          row.operator_name || "",
          row.work || "",
          h1Plan,
          h1Actual,
          h2Plan,
          h2Actual,
          otPlan,
          otActual,
          row.quality_defects || "",
          row.defect_details || "",
          row.responsible_person || "",
          targetQty,
          actualProd,
          productionPercent.toFixed(1) + "%",
          "", // ERP STATUS
          row.reason || "",
          "", // OVERALL % (will be calculated later)
          row.rework || "",
        ];
        excelData.push(dataRow);

        totalTargetQty += targetQty;
        totalActualProd += actualProd;
      });

      // Add summary row
      excelData.push([]);
      excelData.push(["OVERALL PRODUCTION:"]);
      excelData.push(["Target QTY:", totalTargetQty]);
      excelData.push(["Actual Prod.:", totalActualProd]);

      // Calculate overall percentage
      let overallPercent = 0;
      if (totalTargetQty > 0) {
        overallPercent = (totalActualProd / totalTargetQty) * 100;
      }

      // Update overall % in all rows
      for (let i = headers.length; i < excelData.length - 4; i++) {
        if (excelData[i] && excelData[i].length >= 18) {
          excelData[i][17] = overallPercent.toFixed(2); // OVERALL % column
        }
      }
    }

    // Add signature section
    excelData.push([]);
    excelData.push(["PREPARED BY:- AMIT KUMAR PARIDA"]);
    excelData.push(["APPROVED BY: MR. NARENDRA CHAUHAN"]);
    excelData.push([]);
    excelData.push([
      "Store dept sign-",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Purchase dept sign-",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "QC dept sign-",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Plant head sign-",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    // Convert to worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // DEPT. NAME
      { wch: 15 }, // OPERATOR NAME
      { wch: 30 }, // WORK
      { wch: 10 }, // H1 PLAN
      { wch: 10 }, // H1 ACTUAL
      { wch: 10 }, // H2 PLAN
      { wch: 10 }, // H2 ACTUAL
      { wch: 10 }, // OT PLAN
      { wch: 10 }, // OT ACTUAL
      { wch: 12 }, // QUALITY DEFECTS
      { wch: 15 }, // DEFECT DETAILS
      { wch: 15 }, // RESPONSIBLE PERSON
      { wch: 10 }, // TARGET QTY
      { wch: 10 }, // ACTUAL PROD.
      { wch: 12 }, // PRODUCTION %
      { wch: 10 }, // ERP STATUS
      { wch: 10 }, // REASON
      { wch: 10 }, // OVERALL %
      { wch: 10 }, // REWORK
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, ws, "Daily Production Report");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="daily_production_report_${taskId}.xlsx"`
    );

    // Send the buffer
    res.send(buffer);

    console.log(`[EXCEL EXPORT] Successfully exported task ${taskId} to Excel`);
  } catch (error) {
    console.error("Error in exportTaskToExcel:", error);
    res.status(500).json({ error: "Failed to export Excel" });
  }
};

// Export task to PDF
const exportTaskToPDF = async (req, res) => {
  try {
    const taskId = req.params.id;
    // const db = await readDB();
    // const formsDb = await readFormsDB();

    // Find the task and process
    const { task, process } = findTask(db, taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get form data
    let formData = null;
    const submissions = formsDb.submissions.filter(
      (s) => String(s.taskId) === String(taskId)
    );

    if (submissions.length > 0) {
      submissions.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      const latestSubmission = submissions[0];
      formData = latestSubmission.formData;
    } else if (task.formData) {
      formData = task.formData;
    }

    if (!formData) {
      return res
        .status(404)
        .json({ error: "No form data found for this task" });
    }

    // Create PDF document
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="daily_production_report_${taskId}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add company header
    doc.fontSize(16).text("BCPL", { align: "center" });
    doc.moveDown();

    // Add report title
    doc
      .fontSize(18)
      .text("Daily Production Report of SMT line", { align: "center" });
    doc.moveDown();

    // Add date and document details
    const reportDate = formData.date || new Date().toLocaleDateString("en-GB");
    doc.fontSize(12).text(`Date: ${reportDate}`);
    doc.fontSize(10).text("Doc.No.- F-PROD-01");
    doc.fontSize(10).text("REV.NO / DATE-00");
    doc.fontSize(10).text("ISSUE DATE-01.4.24");
    doc.moveDown();

    // Add table headers
    doc
      .fontSize(10)
      .text(
        "DEPT. NAME | OPERATOR NAME | WORK | H1 PLAN | H1 ACTUAL | H2 PLAN | H2 ACTUAL | OT PLAN | OT ACTUAL | TARGET QTY | ACTUAL PROD. | PRODUCTION %"
      );
    doc.moveDown();

    // Add table data
    if (formData.rows && Array.isArray(formData.rows)) {
      let totalTargetQty = 0;
      let totalActualProd = 0;

      formData.rows.forEach((row, index) => {
        const targetQty = parseFloat(row.target_qty) || 0;
        const actualProd = parseFloat(row.actual_production) || 0;
        const h1Plan = parseFloat(row.h1_plan) || 0;
        const h1Actual = parseFloat(row.h1_actual) || 0;
        const h2Plan = parseFloat(row.h2_plan) || 0;
        const h2Actual = parseFloat(row.h2_actual) || 0;
        const otPlan = parseFloat(row.ot_plan) || 0;
        const otActual = parseFloat(row.ot_actual) || 0;

        // Calculate production percentage
        let productionPercent = 0;
        if (targetQty > 0 && !isNaN(targetQty) && !isNaN(actualProd)) {
          productionPercent = (actualProd / targetQty) * 100;
        }

        const rowText = `${row.dept_name || ""} | ${
          row.operator_name || ""
        } | ${
          row.work || ""
        } | ${h1Plan} | ${h1Actual} | ${h2Plan} | ${h2Actual} | ${otPlan} | ${otActual} | ${targetQty} | ${actualProd} | ${productionPercent.toFixed(
          1
        )}%`;

        doc.fontSize(8).text(rowText);
        doc.moveDown(0.5);

        if (!isNaN(targetQty)) totalTargetQty += targetQty;
        if (!isNaN(actualProd)) totalActualProd += actualProd;
      });

      // Add summary section
      doc.moveDown();
      doc.fontSize(12).text("OVERALL PRODUCTION:", { underline: true });
      doc.fontSize(10).text(`Target QTY: ${totalTargetQty}`);
      doc.fontSize(10).text(`Actual Prod.: ${totalActualProd}`);

      // Calculate overall percentage
      let overallPercent = 0;
      if (
        totalTargetQty > 0 &&
        !isNaN(totalTargetQty) &&
        !isNaN(totalActualProd)
      ) {
        overallPercent = (totalActualProd / totalTargetQty) * 100;
      }
      doc.fontSize(10).text(`Overall %: ${overallPercent.toFixed(2)}%`);
    }

    // Add signature section
    doc.moveDown(2);
    doc.fontSize(10).text("PREPARED BY:- AMIT KUMAR PARIDA");
    doc.fontSize(10).text("APPROVED BY: MR. NARENDRA CHAUHAN");
    doc.moveDown();
    doc.fontSize(10).text("Store dept sign-");
    doc.fontSize(10).text("Purchase dept sign-");
    doc.fontSize(10).text("QC dept sign-");
    doc.fontSize(10).text("Plant head sign-");

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error in exportTaskToPDF:", error);
    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export PDF" });
    }
  }
};

// Plant Head approves a daily task
const approveDailyTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Get processes from MongoDB
    const processes = await databaseService.getProcesses();
    const { task, process } = findTask(processes, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!(task.name && task.name.includes("Daily Production Plan"))) {
      return res
        .status(400)
        .json({ error: "Not a daily production plan task" });
    }

    // Update task status
    task.status = "completed";
    task.lastUpdated = new Date().toISOString();

    // Create Daily Production Report task when Daily Production Plan is approved
    if (task.name && task.name.includes("Daily Production Plan")) {
      console.log("📋 Creating Daily Production Report task...");

      // Extract day information from the task name
      const dayMatch = task.name.match(/Day (\d+)/);
      const weekMatch = task.name.match(/Week (\d+)/);
      const monthYearMatch = task.name.match(/- ([A-Za-z]+) (\d{4})/);

      if (dayMatch && weekMatch && monthYearMatch) {
        const dayNumber = parseInt(dayMatch[1], 10);
        const weekNumber = parseInt(weekMatch[1], 10);
        const monthName = monthYearMatch[1];
        const year = monthYearMatch[2];

        // Fetch related data from the approved production plan
        let relatedFormData = null;
        if (task.formData) {
          console.log(
            "📋 Fetching related data from approved production plan..."
          );

          // Create a copy of the plan data with plan fields as readonly and actual fields as empty
          relatedFormData = {
            // Copy header fields from the plan
            ...task.formData,
            // Transform table rows: keep plan data as readonly, add empty actual fields
            rows: task.formData.rows
              ? task.formData.rows.map((row) => ({
                  // Plan fields (readonly in report mode)
                  dept_name: row.dept_name || "",
                  operator_name: row.operator_name || "",
                  work: row.work || "",
                  h1_plan: row.h1_plan || "",
                  h2_plan: row.h2_plan || "",
                  ot_plan: row.ot_plan || "",
                  target_qty: row.target_qty || "",

                  // Actual fields (editable in report mode) - initially empty
                  h1_actual: "",
                  h2_actual: "",
                  ot_actual: "",
                  actual_production: "",
                  quality_defects: "",
                  defect_details: "",
                  responsible_person: "",
                  production_percentage: "",
                  reason: "",
                  rework: "",
                }))
              : [],
          };

          console.log(
            `✅ Fetched ${relatedFormData.rows.length} rows from production plan`
          );
        }

        // Create Daily Production Report task
        const reportTaskId = Date.now().toString();
        const reportTask = {
          taskId: reportTaskId,
          name: `Daily Production Report - Week ${weekNumber} Day ${dayNumber} - ${monthName} ${year}`,
          description: `Daily production report for ${monthName} ${year}, Week ${weekNumber}, Day ${dayNumber}`,
          assignedRole: "production_manager",
          assignedUserId: task.assignedUserId, // Assign to same manager
          status: "pending",
          dependencies: [task.taskId], // Depends on the approved plan
          formId: "F-DAILY-PRODUCTION-ENTRY", // Same form for report
          trigger: {
            type: "event",
            event: "task_completed",
            taskId: task.taskId,
          },
          dueDateRule: {
            type: "fixed_days",
            days: 1, // Due next day
          },
          formData: relatedFormData, // Populate with related data from plan
          lastUpdated: new Date().toISOString(),
          createdForMonth: task.createdForMonth || "",
          weekNumber: weekNumber,
          dayNumber: dayNumber,
          isTemplate: false,
          templateId: null,
          priority: "medium",
          comments: [],
        };

        // Add the report task to the process
        process.tasks.push(reportTask);
        console.log(
          `✅ Created Daily Production Report task: ${reportTask.name}`
        );
        console.log(
          `✅ Populated with ${
            relatedFormData?.rows?.length || 0
          } rows from production plan`
        );
      }
    }

    // Update the process in MongoDB
    if (process && process._id) {
      await Process.findByIdAndUpdate(process._id, { tasks: process.tasks });
      console.log(
        "✅ Daily task approved, report task created, and process updated"
      );
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("Error in approveDailyTask:", error);
    res.status(500).json({ error: "Failed to approve task" });
  }
};

// Plant Head rejects a daily task
const rejectDailyTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Get processes from MongoDB
    const processes = await databaseService.getProcesses();
    const { task, process } = findTask(processes, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!(task.name && task.name.includes("Daily Production Plan"))) {
      return res
        .status(400)
        .json({ error: "Not a daily production plan task" });
    }

    // Update task status
    task.status = "rejected";
    task.lastUpdated = new Date().toISOString();

    // Update the process in MongoDB
    if (process && process._id) {
      await Process.findByIdAndUpdate(process._id, { tasks: process.tasks });
      console.log("✅ Daily task rejected and process updated");
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("Error in rejectDailyTask:", error);
    res.status(500).json({ error: "Failed to reject task" });
  }
};

// Plant Head reassigns a daily task to another Production Manager
const reassignDailyTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { newManagerId } = req.body;

    // Get processes and users from MongoDB
    const processes = await databaseService.getProcesses();
    const users = await databaseService.getUsers();
    const { task, process } = findTask(processes, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!(task.name && task.name.includes("Daily Production Plan"))) {
      return res
        .status(400)
        .json({ error: "Not a daily production plan task" });
    }

    task.status = "pending";

    // If newManagerId is provided, reassign to that manager, otherwise keep same manager
    if (newManagerId) {
      // Find the user and set assignedRole if valid
      const user = users.find((u) => u._id === newManagerId);
      if (user && user.roles.includes("production_manager")) {
        task.assignedRole = "production_manager";
        task.assignedUserId = user._id;
        console.log(`✅ Task reassigned to ${user.name}`);
      }
    }

    task.lastUpdated = new Date().toISOString();

    // Update the process in MongoDB
    if (process && process._id) {
      await Process.findByIdAndUpdate(process._id, { tasks: process.tasks });
      console.log("✅ Task reassigned and process updated");
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("Error in reassignDailyTask:", error);
    res.status(500).json({ error: "Failed to reassign task" });
  }
};

// Assign task to specific user
const assignTaskToUser = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { userId } = req.body;
    // const db = await readDB();
    const { task } = findTask(db, taskId);

    if (!task) return res.status(404).json({ error: "Task not found" });

    if (userId) {
      // Find the user and verify they have the required role
      const user = db.users.find((u) => u.id === Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.roles.includes(task.assignedRole)) {
        return res.status(400).json({
          error: `User does not have the required role: ${task.assignedRole}`,
        });
      }

      task.assignedUserId = user.id;
    } else {
      // Remove specific user assignment
      task.assignedUserId = null;
    }

    task.lastUpdated = new Date().toISOString();
    // await writeDB(db);

    res.json({ success: true, task });
  } catch (error) {
    console.error("Error in assignTaskToUser:", error);
    res.status(500).json({ error: "Failed to assign task to user" });
  }
};

// Get available users for a specific role
const getAvailableUsersForRole = async (req, res) => {
  try {
    const role = req.params.role;
    // const db = await readDB();
    const users = db.users.filter(
      (user) =>
        user.roles && user.roles.includes(role) && user.isActive !== false
    );
    res.json(users);
  } catch (error) {
    console.error("Error in getAvailableUsersForRole:", error);
    res.status(500).json({ error: "Failed to fetch available users" });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    // const db = await readDB();
    // const formsDb = await readFormsDB();

    // Find the task and process
    const { task, process } = findTask(db, taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if task is a template (should not be deleted)
    if (task.id === 1001 || task.id === 2001 || task.id === 2002) {
      return res.status(400).json({
        error:
          "Cannot delete template tasks. Template tasks are used to create new tasks.",
      });
    }

    // Check if task has dependent tasks
    const dependentTasks = process.tasks.filter(
      (t) => t.dependencies && t.dependencies.includes(task.id)
    );

    if (dependentTasks.length > 0) {
      return res.status(400).json({
        error: `Cannot delete task. It has ${dependentTasks.length} dependent task(s) that must be deleted first.`,
        dependentTasks: dependentTasks.map((t) => ({ id: t.id, name: t.name })),
      });
    }

    // Remove task from process
    const taskIndex = process.tasks.findIndex((t) => t.id === task.id);
    if (taskIndex !== -1) {
      process.tasks.splice(taskIndex, 1);
    }

    // Remove related form submissions
    if (formsDb.submissions) {
      formsDb.submissions = formsDb.submissions.filter(
        (submission) => submission.taskId !== String(taskId)
      );
    }

    // Write both databases
    // await Promise.all([writeDB(db), writeFormsDB(formsDb)]);
    res.status(501).json({ error: "Feature not implemented for MongoDB" });

    res.json({
      success: true,
      message: "Task deleted successfully",
      deletedTask: task,
    });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).json({ error: "Failed to delete task" });
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
  approveDailyTask,
  rejectDailyTask,
  reassignDailyTask,
  exportTaskToPDF,
  assignTaskToUser,
  getAvailableUsersForRole,
  deleteTask,
};
