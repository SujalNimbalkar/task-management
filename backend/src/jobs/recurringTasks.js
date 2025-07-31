const databaseService = require("../services/databaseService");
const cron = require("node-cron");
const dateFnsTz = require("date-fns-tz");
console.log("[DEBUG] dateFnsTz exports:", Object.keys(dateFnsTz));
const utcToZonedTime = dateFnsTz.toZonedTime;
const IST_TIMEZONE = "Asia/Kolkata";

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return d >= monday && d <= sunday;
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

function isThreeDaysBeforeEndOfMonth() {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const threeDaysBefore = new Date(lastDayOfMonth);
  threeDaysBefore.setDate(lastDayOfMonth.getDate() - 3);

  return (
    now.getFullYear() === threeDaysBefore.getFullYear() &&
    now.getMonth() === threeDaysBefore.getMonth() &&
    now.getDate() === threeDaysBefore.getDate()
  );
}

// Helper to get last day of month minus N days
function getDueDateEndOfMonthMinusDays(year, month, days) {
  const lastDay = new Date(year, month + 1, 0);
  lastDay.setDate(lastDay.getDate() - days);
  lastDay.setHours(13, 45, 0, 0); // 13:45 = 1:45 PM
  return lastDay.toISOString();
}

// Helper function to calculate weeks in a month
function calculateWeeksInMonth(monthStartDate) {
  const startDate = new Date(monthStartDate);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let weekNumber = 1;
  let currentDay = 1;

  while (currentDay <= daysInMonth) {
    const weekStart = currentDay;
    const weekEnd = Math.min(currentDay + 6, daysInMonth);

    weeks.push({
      weekNumber: weekNumber,
      startDay: weekStart,
      endDay: weekEnd,
      startDate: new Date(year, month, weekStart),
      endDate: new Date(year, month, weekEnd),
    });

    currentDay = weekEnd + 1;
    weekNumber++;
  }

  return weeks;
}

// Helper function to generate weekly task IDs
function generateWeeklyTaskIds(baseId, weekCount) {
  const taskIds = [];
  for (let i = 0; i < weekCount; i++) {
    taskIds.push(baseId + i);
  }
  return taskIds;
}

// Helper function to populate weekly tasks with monthly plan data
async function populateWeeklyTasksWithMonthlyData(monthlyTaskId, process, db) {
  try {
    // Find the monthly task
    const monthlyTask = process.tasks.find((t) => t.id === monthlyTaskId);
    if (!monthlyTask || !monthlyTask.formData) {
      console.log(
        `[CRON] Monthly task ${monthlyTaskId} not found or no form data`
      );
      return;
    }

    // Find all weekly tasks that depend on this monthly task
    const weeklyTasks = process.tasks.filter(
      (t) =>
        t.dependencies &&
        t.dependencies.includes(monthlyTaskId) &&
        t.formId === "F-PRODUCTION-PLAN-ENTRY" &&
        t.name &&
        t.name.includes("Weekly Production Plan") &&
        !t.isTemplate // Only update non-template tasks
    );

    console.log(
      `[CRON] Found ${weeklyTasks.length} weekly tasks to populate with monthly data`
    );

    // Populate each weekly task with data from monthly plan
    for (const weeklyTask of weeklyTasks) {
      if (
        monthlyTask.formData.rows &&
        Array.isArray(monthlyTask.formData.rows)
      ) {
        // Create independent data copy for each weekly task
        const independentWeeklyData = {
          ...weeklyTask.formData,
          month_start_date: monthlyTask.formData.month_start_date,
          rows: monthlyTask.formData.rows.map((row) => ({
            ...row,
            // Keep monthly_qty but clear weekly_qty for user to fill
            weekly_qty: "",
          })),
        };

        weeklyTask.formData = independentWeeklyData;

        console.log(
          `[CRON] Populated weekly task ${weeklyTask.id} with ${weeklyTask.formData.rows.length} rows from monthly plan`
        );
      }
    }
  } catch (error) {
    console.error(`[CRON] Error populating weekly tasks:`, error);
  }
}

// Helper function to update weekly tasks with monthly plan data
async function updateWeeklyTasksWithMonthlyData(monthlyTaskId, process, db) {
  try {
    // Find the monthly task
    const monthlyTask = process.tasks.find((t) => t.id === monthlyTaskId);
    if (!monthlyTask || !monthlyTask.formData) {
      console.log(
        `[CRON] Monthly task ${monthlyTaskId} not found or no form data`
      );
      return;
    }

    // Find all weekly tasks that depend on this monthly task
    const weeklyTasks = process.tasks.filter(
      (t) =>
        t.dependencies &&
        t.dependencies.includes(monthlyTaskId) &&
        t.formId === "F-PRODUCTION-PLAN-ENTRY" &&
        t.name &&
        t.name.includes("Weekly Production Plan") &&
        !t.isTemplate // Only update non-template tasks
    );

    console.log(
      `[CRON] Found ${weeklyTasks.length} weekly tasks to update with monthly data`
    );

    // Update each weekly task with data from monthly plan
    for (const weeklyTask of weeklyTasks) {
      if (
        monthlyTask.formData.rows &&
        Array.isArray(monthlyTask.formData.rows)
      ) {
        // Create independent data copy for each weekly task
        const independentWeeklyData = {
          ...weeklyTask.formData,
          month_start_date: monthlyTask.formData.month_start_date,
          rows: monthlyTask.formData.rows.map((row) => ({
            ...row,
            // Keep monthly_qty but clear weekly_qty for user to fill
            weekly_qty: "",
          })),
        };

        weeklyTask.formData = independentWeeklyData;

        console.log(
          `[CRON] Updated weekly task ${weeklyTask.id} with ${weeklyTask.formData.rows.length} rows from monthly plan`
        );
      }
    }
  } catch (error) {
    console.error(`[CRON] Error updating weekly tasks:`, error);
  }
}

// Test function to manually trigger monthly task creation
async function testMonthlyTaskCreation() {
  try {
    console.log("[TEST] Starting manual test of monthly task creation...");
    const db = await readDB();
    let changed = false;

    for (const process of db.processes) {
      if (!process.tasks) continue;

      for (const task of process.tasks) {
        if (
          task.id === 1001 &&
          task.trigger &&
          task.trigger.type === "time" &&
          task.trigger.recurrence === "monthly"
        ) {
          console.log("[TEST] Found Monthly Production Plan template task");

          // Create a new task for testing
          const newTaskId = Date.now();
          const now = new Date();
          const monthName = now.toLocaleString("default", { month: "long" });
          const year = now.getFullYear();

          const newMonthlyTask = {
            id: newTaskId,
            name: `Monthly Production Plan - ${monthName} ${year} (TEST)`,
            assignedRole: task.assignedRole,
            status: "pending",
            dependencies: [],
            formId: task.formId,
            trigger: {
              type: "time",
              recurrence: "monthly",
              dayOfMonth: "29",
            },
            dueDateRule: {
              type: "end_of_month_minus_days",
              days: 3,
            },
            formData: null,
            lastUpdated: now.toISOString(),
            createdForMonth: `${year}-${String(now.getMonth() + 1).padStart(
              2,
              "0"
            )}`,
            isTestTask: true,
          };

          if (
            newMonthlyTask.dueDateRule &&
            newMonthlyTask.dueDateRule.type === "end_of_month_minus_days"
          ) {
            newMonthlyTask.dueDate = getDueDateEndOfMonthMinusDays(
              now.getFullYear(),
              now.getMonth(),
              newMonthlyTask.dueDateRule.days
            );
          }

          process.tasks.push(newMonthlyTask);
          changed = true;

          console.log(
            `[TEST] Created test task: ${newMonthlyTask.name} (ID: ${newTaskId})`
          );
          console.log(`[TEST] Due date: ${newMonthlyTask.dueDate}`);
          console.log(
            `[TEST] Assigned to role: ${newMonthlyTask.assignedRole}`
          );
        }
      }
    }

    if (changed) {
      await writeDB(db);
      console.log(
        "[TEST] Test completed successfully! Check your db.json file."
      );
    } else {
      console.log("[TEST] No changes made - template task not found.");
    }
  } catch (err) {
    console.error("[TEST] Error during test:", err);
  }
}

cron.schedule("10 17 * * *", async () => {
  const startTime = Date.now();
  try {
    const now = new Date();
    const nowIST = utcToZonedTime(now, IST_TIMEZONE);
    const istHour = nowIST.getHours();
    const istMinute = nowIST.getMinutes();
    const istDay = nowIST.getDate();
    console.log(
      `[CRON][DEBUG] UTC: ${now.toISOString()} | IST: ${nowIST.toLocaleString(
        "en-IN",
        { timeZone: IST_TIMEZONE }
      )} | Day: ${istDay} Hour: ${istHour} Min: ${istMinute}`
    );
    const db = await readDB();
    let changed = false;

    for (const process of db.processes) {
      if (!process.tasks) continue;

      // Check for completed monthly tasks and populate weekly tasks
      for (const task of process.tasks) {
        if (
          task.name &&
          task.name.includes("Monthly Production Plan") &&
          task.status === "completed" &&
          task.formData &&
          !task.isTestTask
        ) {
          // Skip test tasks
          // This is a completed monthly task, populate its weekly tasks
          await populateWeeklyTasksWithMonthlyData(task.id, process, db);
        }
      }

      // Check for updated monthly tasks and update weekly tasks
      for (const task of process.tasks) {
        if (
          task.name &&
          task.name.includes("Monthly Production Plan") &&
          task.formData &&
          task.formData.rows &&
          !task.isTestTask
        ) {
          // Skip test tasks
          // Check if this monthly task has been updated recently
          const lastUpdated = new Date(task.lastUpdated);
          const now = new Date();
          const timeDiff = now - lastUpdated;

          // If updated within the last 5 minutes, update weekly tasks
          if (timeDiff < 5 * 60 * 1000) {
            // 5 minutes in milliseconds
            console.log(
              `[CRON] Monthly task ${task.id} was recently updated, updating weekly tasks...`
            );
            await updateWeeklyTasksWithMonthlyData(task.id, process, db);
          }
        }
      }

      for (const task of process.tasks) {
        if (!task.trigger || task.trigger.type !== "time") continue;

        // Use IST time for monthly trigger
        if (task.trigger.recurrence === "monthly") {
          if (task.id === 1001 && task.trigger.dayOfMonth === "30") {
            console.log(
              `[CRON][DEBUG] Checking monthly trigger for task ${task.id}:`
            );
            console.log(
              `[CRON][DEBUG] - istDay: ${istDay}, istHour: ${istHour}, istMinute: ${istMinute}`
            );
            console.log(
              `[CRON][DEBUG] - task.lastUpdated: ${task.lastUpdated}`
            );
            console.log(
              `[CRON][DEBUG] - isThisMonth(task.lastUpdated): ${isThisMonth(
                task.lastUpdated
              )}`
            );
            console.log(`[CRON][DEBUG] - task.status: ${task.status}`);
            if (
              istDay === 30 &&
              task.status === "pending" &&
              (!task.lastUpdated || !isThisMonth(task.lastUpdated))
            ) {
              // Create a new task for this month instead of reusing the template
              const newTaskId = Date.now(); // Generate unique ID
              const nextMonth = new Date(
                nowIST.getFullYear(),
                nowIST.getMonth() + 1,
                1
              );
              const monthName = nextMonth.toLocaleString("default", {
                month: "long",
              });
              const year = nextMonth.getFullYear();

              // Define monthStartDate for the new task
              const monthStartDate = `${year}-${String(
                nextMonth.getMonth() + 1
              ).padStart(2, "0")}-01`;

              // Create new task object
              const newMonthlyTask = {
                id: newTaskId,
                name: `Monthly Production Plan - ${monthName} ${year}`,
                assignedRole: task.assignedRole,
                assignedUserId: task.assignedUserId || null,
                status: "pending",
                dependencies: [],
                formId: task.formId,
                trigger: {
                  type: "time",
                  recurrence: "monthly",
                  dayOfMonth: "30",
                },
                dueDateRule: {
                  type: "end_of_month_minus_days",
                  days: 3,
                },
                formData: {
                  month_start_date: monthStartDate,
                  rows: [], // Initialize with empty rows for independent data
                },
                lastUpdated: nowIST.toISOString(),
                createdForMonth: `${year}-${String(
                  nextMonth.getMonth() + 1
                ).padStart(2, "0")}`,
                isTemplate: false, // Mark as non-template
                templateId: task.id, // Reference to the template that created this task
              };

              // Set dueDate to 3 days before end of next month
              if (
                newMonthlyTask.dueDateRule &&
                newMonthlyTask.dueDateRule.type === "end_of_month_minus_days"
              ) {
                newMonthlyTask.dueDate = getDueDateEndOfMonthMinusDays(
                  nextMonth.getFullYear(),
                  nextMonth.getMonth(),
                  newMonthlyTask.dueDateRule.days
                );
              }

              // Add the new task to the process
              process.tasks.push(newMonthlyTask);

              // === ONLY CREATE MONTHLY TASK - DEPENDENT TASKS WILL BE CREATED WHEN MONTHLY IS COMPLETED ===
              console.log(
                `[CRON] Created monthly task for ${monthName} ${year} - dependent tasks will be created when monthly plan is completed`
              );

              // === Notification Placeholder ===
              // TODO: Replace this with real email/SMS notification logic
              console.log(
                `[NOTIFY] New task '${newMonthlyTask.name}' assigned to role '${newMonthlyTask.assignedRole}' with due date ${newMonthlyTask.dueDate}`
              );
              // ==============================

              changed = true;
              console.log(
                `[CRON] New Monthly Production Plan created for ${monthName} ${year} (ID: ${newTaskId}) - Weekly and Daily tasks will be created when monthly plan is completed`
              );
            }
          }
        } else if (task.trigger.recurrence === "daily") {
          if (!task.lastUpdated || !isToday(task.lastUpdated)) {
            task.status = "pending";
            task.lastUpdated = now.toISOString();
            changed = true;
          }
        } else if (task.trigger.recurrence === "weekly") {
          if (!task.lastUpdated || !isThisWeek(task.lastUpdated)) {
            task.status = "pending";
            task.lastUpdated = now.toISOString();
            changed = true;
          }
        }
      }
    }

    if (changed) {
      await writeDB(db);
      console.log("[CRON] Recurring tasks reset to pending where needed.");
    }
    const executionTime = Date.now() - startTime;
    console.log(`[CRON] Scheduled check completed in ${executionTime}ms`);
  } catch (err) {
    const executionTime = Date.now() - startTime;
    console.error(
      `[CRON] Error resetting recurring tasks (${executionTime}ms):`,
      err
    );
  }
});

// Export the test function
module.exports = { testMonthlyTaskCreation };
