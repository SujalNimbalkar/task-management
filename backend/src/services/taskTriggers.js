// Form validation, trigger logic, and helpers for tasks
const { readFormsDB } = require("../utils/formsDbHelper");

// Helper: Get latest form submission for a task
async function getLatestFormDataForTask(taskId, formsDbOverride) {
  const formsDb = formsDbOverride || (await readFormsDB());
  const submissions = formsDb.submissions.filter(
    (s) => String(s.taskId) === String(taskId)
  );
  if (submissions.length === 0) return null;
  submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return submissions[0].formData;
}

// Helper: Calculate weeks in a month based on calendar dates
function calculateWeeksInMonth(dateStr) {
  // Accepts YYYY-MM-DD, extracts month and year
  const dateObj = new Date(dateStr);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-based
  const lastDay = new Date(year, month, 0); // Last day of month
  const totalDays = lastDay.getDate();

  const weeks = [];
  let currentWeek = 1;
  let weekStart = 1;

  // Calculate weeks based on actual calendar weeks (1-7, 8-14, 15-21, 22-28, 29-31/30)
  for (let day = 1; day <= totalDays; day++) {
    if (day % 7 === 1 || day === 1) {
      // Start of a new week (every 7 days)
      if (day > 1) {
        weeks.push({
          weekNumber: currentWeek,
          startDay: weekStart,
          endDay: day - 1,
          days: 6, // 6 working days per week (Monday through Saturday)
        });
        currentWeek++;
      }
      weekStart = day;
    }
  }

  // Add the last week
  if (weekStart <= totalDays) {
    const remainingDays = totalDays - weekStart + 1;
    weeks.push({
      weekNumber: currentWeek,
      startDay: weekStart,
      endDay: totalDays,
      days: Math.min(remainingDays, 6), // Cap at 6 days, but allow fewer for last week
    });
  }

  return weeks;
}

// Helper: Generate weekly task IDs dynamically
function generateWeeklyTaskIds(baseId, weekCount) {
  const taskIds = [];
  for (let i = 0; i < weekCount; i++) {
    taskIds.push(baseId + i);
  }
  return taskIds;
}

// Helper: Generate daily task IDs for a specific week
function generateDailyTaskIds(weekNumber, baseId = 1006) {
  // Each week has 6 daily tasks (Monday to Saturday)
  const dailyTasksPerWeek = 6;
  const startId = baseId + (weekNumber - 1) * dailyTasksPerWeek;
  return Array.from({ length: dailyTasksPerWeek }, (_, i) => startId + i);
}

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

// Analyze form data and trigger dependent tasks based on conditions
async function analyzeFormDataAndTriggerTasks(
  process,
  completedTask,
  formData,
  db
) {
  try {
    // Production Planning Workflow triggers
    if (process.name === "Production Planning Workflow") {
      // Monthly Production Plan (Task 1001) - triggers weekly plans dynamically
      if (
        completedTask.id === 1001 &&
        completedTask.formId === "F-PRODUCTION-PLAN-ENTRY"
      ) {
        // Calculate weeks based on the month from form data
        const monthStartDate = formData.month_start_date || "2025-07-01"; // Default fallback
        const weeks = calculateWeeksInMonth(monthStartDate);

        console.log(
          `[TRIGGER] Monthly plan completed. Calculated ${weeks.length} weeks for ${monthStartDate}:`,
          weeks
        );

        // Generate weekly task IDs dynamically
        const weeklyTaskIds = generateWeeklyTaskIds(1002, weeks.length);

        // Trigger weekly tasks for each calculated week
        for (let i = 0; i < weeklyTaskIds.length; i++) {
          const taskId = weeklyTaskIds[i];
          const week = weeks[i];

          // Check if task exists, if not create it dynamically
          let weeklyTask = process.tasks.find((t) => t.id === taskId);

          if (!weeklyTask) {
            // Create new weekly task dynamically
            weeklyTask = {
              id: taskId,
              name: `Weekly Production Plan - Week ${week.weekNumber} (${week.startDay}-${week.endDay})`,
              assignedRole: "production_manager",
              status: "pending",
              dependencies: [1001],
              formId: "F-PRODUCTION-PLAN-ENTRY",
              trigger: {
                type: "event",
                event: "task_completed",
                taskId: 1001,
              },
              formData: null,
              lastUpdated: new Date().toISOString(),
            };

            // Add to process tasks
            process.tasks.push(weeklyTask);
            console.log(
              `[TRIGGER] Created new weekly task ${taskId} for Week ${week.weekNumber}`
            );
          } else {
            // Update existing task
            weeklyTask.status = "pending";
            weeklyTask.lastUpdated = new Date().toISOString();
            weeklyTask.name = `Weekly Production Plan - Week ${week.weekNumber} (${week.startDay}-${week.endDay})`;
            console.log(
              `[TRIGGER] Updated weekly task ${taskId} for Week ${week.weekNumber}`
            );
          }

          // Pre-fill weekly task with data from monthly plan
          if (formData.rows && Array.isArray(formData.rows)) {
            const weekRows = formData.rows.map((monthlyRow) => ({
              item_name: monthlyRow.item_name,
              customer_name: monthlyRow.customer_name,
              monthly_qty: monthlyRow.monthly_qty,
              weekly_qty: "", // Leave empty for user to fill
            }));

            weeklyTask.formData = {
              month_start_date: formData.month_start_date,
              week_number: week.weekNumber,
              week_dates: `${week.startDay}-${week.endDay}`,
              rows: weekRows,
            };

            console.log(
              `[TRIGGER] Pre-filled weekly task ${taskId} with ${weekRows.length} items from monthly plan`
            );
          }
        }
      }

      // Weekly Production Plans - trigger daily plans dynamically
      if (
        completedTask.formId === "F-PRODUCTION-PLAN-ENTRY" &&
        completedTask.name.startsWith("Weekly Production Plan - Week ")
      ) {
        // Extract week number from task name or form data
        const weekMatch = completedTask.name.match(/Week (\d+)/);
        const weekNumber = weekMatch
          ? parseInt(weekMatch[1])
          : formData.week_number
          ? parseInt(formData.week_number)
          : 1;
        // Get the month start date from formData
        const monthStartDate = formData.month_start_date;
        // Calculate weeks for the month
        const weeks = calculateWeeksInMonth(monthStartDate);
        const weekInfo = weeks.find((w) => w.weekNumber === weekNumber);
        const daysInWeek = weekInfo ? weekInfo.days : 5;
        // Find the max current task ID to keep IDs unique
        let maxTaskId = Math.max(...process.tasks.map((t) => t.id), 1005);
        // Create daily plan tasks for each day in this week
        for (let i = 0; i < daysInWeek; i++) {
          maxTaskId++;
          const dayNumber = i + 1;
          let dailyTask = process.tasks.find(
            (t) =>
              t.name ===
                `Daily Production Plan - Week ${weekNumber} Day ${dayNumber}` &&
              t.dependencies.includes(completedTask.id)
          );
          if (!dailyTask) {
            dailyTask = {
              id: maxTaskId,
              name: `Daily Production Plan - Week ${weekNumber} Day ${dayNumber}`,
              assignedRole: "production_manager",
              status: "pending",
              dependencies: [completedTask.id],
              formId: "F-DAILY-PRODUCTION-ENTRY",
              trigger: {
                type: "event",
                event: "task_completed",
                taskId: completedTask.id,
              },
              formData: null,
              lastUpdated: new Date().toISOString(),
            };
            process.tasks.push(dailyTask);
            console.log(
              `[TRIGGER] Created new daily task ${dailyTask.id} for Week ${weekNumber} Day ${dayNumber}`
            );
          } else {
            dailyTask.status = "pending";
            dailyTask.lastUpdated = new Date().toISOString();
            dailyTask.name = `Daily Production Plan - Week ${weekNumber} Day ${dayNumber}`;
            console.log(
              `[TRIGGER] Updated daily task ${dailyTask.id} for Week ${weekNumber} Day ${dayNumber}`
            );
          }
        }
      }

      // Daily Production Plans - trigger daily production reports
      if (
        completedTask.formId === "F-DAILY-PRODUCTION-ENTRY" &&
        completedTask.name.includes("Plan")
      ) {
        // Extract week and day number from task name
        const nameMatch = completedTask.name.match(/Week (\d+) Day (\d+)/);
        if (nameMatch) {
          const weekNumber = parseInt(nameMatch[1]);
          const dayNumber = parseInt(nameMatch[2]);
          // Find the max current task ID to keep IDs unique
          let maxTaskId = Math.max(...process.tasks.map((t) => t.id), 1010);
          // Check if report task exists
          let reportTask = process.tasks.find(
            (t) =>
              t.name ===
                `Daily Production Report - Week ${weekNumber} Day ${dayNumber}` &&
              t.dependencies.includes(completedTask.id)
          );
          if (!reportTask) {
            maxTaskId++;
            // Pre-fill report formData from plan
            let prefilledRows = [];
            if (
              completedTask.formData &&
              completedTask.formData.rows &&
              Array.isArray(completedTask.formData.rows)
            ) {
              prefilledRows = completedTask.formData.rows.map((row) => ({
                dept_name: row.dept_name || "",
                operator_name: row.operator_name || "",
                work: row.work || "",
                h1_plan: row.h1_plan || "",
                h2_plan: row.h2_plan || "",
                ot_plan: row.ot_plan || "",
                target_qty: row.target_qty || "",
                // Actual/report fields empty
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
              }));
            }
            reportTask = {
              id: maxTaskId,
              name: `Daily Production Report - Week ${weekNumber} Day ${dayNumber}`,
              assignedRole: "production_manager",
              status: "pending",
              dependencies: [completedTask.id],
              formId: "F-DAILY-PRODUCTION-ENTRY",
              trigger: {
                type: "event",
                event: "task_completed",
                taskId: completedTask.id,
              },
              formData: {
                date: completedTask.formData?.date || "",
                rows: prefilledRows,
              },
              lastUpdated: new Date().toISOString(),
            };
            process.tasks.push(reportTask);
            console.log(
              `[TRIGGER] Created new report task ${reportTask.id} for Week ${weekNumber} Day ${dayNumber}`
            );
          } else {
            reportTask.status = "pending";
            reportTask.lastUpdated = new Date().toISOString();
            reportTask.name = `Daily Production Report - Week ${weekNumber} Day ${dayNumber}`;
            // Only pre-fill if not already filled
            if (
              !reportTask.formData ||
              !reportTask.formData.rows ||
              reportTask.formData.rows.length === 0
            ) {
              let prefilledRows = [];
              if (
                completedTask.formData &&
                completedTask.formData.rows &&
                Array.isArray(completedTask.formData.rows)
              ) {
                prefilledRows = completedTask.formData.rows.map((row) => ({
                  dept_name: row.dept_name || "",
                  operator_name: row.operator_name || "",
                  work: row.work || "",
                  h1_plan: row.h1_plan || "",
                  h2_plan: row.h2_plan || "",
                  ot_plan: row.ot_plan || "",
                  target_qty: row.target_qty || "",
                  // Actual/report fields empty
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
                }));
              }
              reportTask.formData = {
                date: completedTask.formData?.date || "",
                rows: prefilledRows,
              };
            }
            console.log(
              `[TRIGGER] Updated report task ${reportTask.id} for Week ${weekNumber} Day ${dayNumber}`
            );
          }
          // Pre-fill the report task with data from the plan task (existing logic follows)
        }
      }

      // Daily Production Reports - trigger action plans if production < 85%
      if (
        completedTask.formId === "F-DAILY-PRODUCTION-ENTRY" &&
        completedTask.name.includes("Report")
      ) {
        const latestFormData = await getLatestFormDataForTask(completedTask.id);
        if (latestFormData) {
          // Check if any row has production < 85%
          let shouldTriggerActionPlan = false;

          if (latestFormData.rows && Array.isArray(latestFormData.rows)) {
            // Check each row in the table
            for (const row of latestFormData.rows) {
              const actualProduction = parseFloat(row.actual_production);
              const targetQty = parseFloat(row.target_qty);

              if (
                !isNaN(actualProduction) &&
                !isNaN(targetQty) &&
                targetQty > 0
              ) {
                const achievementPercentage =
                  (actualProduction / targetQty) * 100;
                if (achievementPercentage < 85) {
                  shouldTriggerActionPlan = true;
                  break;
                }
              }
            }
          } else {
            // Handle legacy single-row structure
            const actualProduction = parseFloat(
              latestFormData.actual_production
            );
            const targetQty = parseFloat(latestFormData.target_qty);

            if (
              !isNaN(actualProduction) &&
              !isNaN(targetQty) &&
              targetQty > 0
            ) {
              const achievementPercentage =
                (actualProduction / targetQty) * 100;
              shouldTriggerActionPlan = achievementPercentage < 85;
            }
          }

          if (shouldTriggerActionPlan) {
            // Extract week and day from task name
            const nameMatch = completedTask.name.match(/Week (\d+) (\w+)/);
            if (nameMatch) {
              const weekNumber = parseInt(nameMatch[1]);
              const dayName = nameMatch[2];

              // Generate action plan task ID
              const actionBaseId = 1016; // Adjust this based on your numbering scheme
              const dailyTaskIds = generateDailyTaskIds(weekNumber);
              const reportIndex = dailyTaskIds.indexOf(completedTask.id);

              if (reportIndex !== -1) {
                const actionTaskId =
                  actionBaseId + (weekNumber - 1) * 5 + reportIndex;

                // Check if action task exists, if not create it dynamically
                let actionTask = process.tasks.find(
                  (t) => t.id === actionTaskId
                );

                if (!actionTask) {
                  // Create new action task dynamically
                  actionTask = {
                    id: actionTaskId,
                    name: `Action Plan - Week ${weekNumber} ${dayName}`,
                    assignedRole: "production_manager",
                    status: "pending",
                    dependencies: [completedTask.id],
                    formId: "F-ACTION-PLAN",
                    trigger: {
                      type: "event",
                      event: "task_completed_and_condition_satisfied",
                      taskId: completedTask.id,
                    },
                    formData: null,
                    lastUpdated: new Date().toISOString(),
                  };

                  // Add to process tasks
                  process.tasks.push(actionTask);
                  console.log(
                    `[TRIGGER] Created new action task ${actionTaskId} for Week ${weekNumber} ${dayName}`
                  );
                } else {
                  // Update existing task
                  actionTask.status = "pending";
                  actionTask.lastUpdated = new Date().toISOString();
                  actionTask.name = `Action Plan - Week ${weekNumber} ${dayName}`;
                  console.log(
                    `[TRIGGER] Updated action task ${actionTaskId} for Week ${weekNumber} ${dayName}`
                  );
                }

                // Pre-fill the action plan task with data from the production report
                if (completedTask.formData) {
                  const reportData = completedTask.formData;

                  // Handle table structure
                  if (reportData.rows && Array.isArray(reportData.rows)) {
                    // Convert report rows to action plan rows (only rows with <85% achievement)
                    const actionRows = reportData.rows
                      .filter((reportRow) => {
                        const actualProd = parseFloat(
                          reportRow.actual_production
                        );
                        const targetQty = parseFloat(reportRow.target_qty);
                        return (
                          actualProd &&
                          targetQty &&
                          (actualProd / targetQty) * 100 < 85
                        );
                      })
                      .map((reportRow) => {
                        const actualProd = parseFloat(
                          reportRow.actual_production
                        );
                        const targetQty = parseFloat(reportRow.target_qty);
                        const achievement =
                          targetQty > 0 ? (actualProd / targetQty) * 100 : 0;

                        return {
                          date: reportData.date,
                          department: reportRow.department,
                          operator_name: reportRow.operator_name,
                          work_description: reportRow.work_description,
                          target_qty: reportRow.target_qty,
                          actual_production: reportRow.actual_production,
                          achievement_percentage: achievement.toFixed(1),
                          // Leave action plan specific fields empty for user to fill
                          reason_for_low_production: "",
                          corrective_actions: "",
                          responsible_person: "",
                          target_completion_date: "",
                        };
                      });

                    actionTask.formData = {
                      date: reportData.date,
                      rows: actionRows,
                    };
                  } else {
                    // Handle legacy single-row structure
                    const actualProduction = parseFloat(
                      reportData.actual_production
                    );
                    const targetQty = parseFloat(reportData.target_qty);
                    const achievementPercentage =
                      targetQty > 0 ? (actualProduction / targetQty) * 100 : 0;

                    const prefilledData = {
                      date: reportData.date,
                      department: reportData.department,
                      operator_name: reportData.operator_name,
                      work_description: reportData.work_description,
                      target_qty: reportData.target_qty,
                      actual_production: reportData.actual_production,
                      achievement_percentage: achievementPercentage.toFixed(1),
                      // Leave action plan specific fields empty for user to fill
                      reason_for_low_production: "",
                      corrective_actions: "",
                      responsible_person: "",
                      target_completion_date: "",
                    };

                    actionTask.formData = prefilledData;
                  }
                  console.log(
                    `[TRIGGER] Action plan task ${actionTaskId} triggered by production report ${completedTask.id} with pre-filled data`
                  );
                } else {
                  console.log(
                    `[TRIGGER] Action plan task ${actionTaskId} triggered by production report ${completedTask.id}`
                  );
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in analyzeFormDataAndTriggerTasks:", error);
  }
}

// Unified trigger logic: called after a task is completed and form is submitted
async function triggerDependentTasks(process, completedTask, db, formsDb) {
  // First, call the analyzeFormDataAndTriggerTasks to handle pre-filling logic
  if (completedTask.formData) {
    await analyzeFormDataAndTriggerTasks(
      process,
      completedTask,
      completedTask.formData,
      db
    );
  }

  // Then handle the regular dependency triggering
  for (const task of process.tasks) {
    if (
      task.dependencies &&
      task.dependencies.includes(completedTask.id) &&
      task.status !== "completed" &&
      task.status !== "pending"
    ) {
      let shouldTrigger = true;

      if (task.trigger && task.trigger.event) {
        switch (task.trigger.event) {
          case "task_completed_and_condition_satisfied": {
            // For action plan tasks, check if production is below 85%
            if (task.formId === "F-ACTION-PLAN") {
              const latestFormData = await getLatestFormDataForTask(
                completedTask.id,
                formsDb
              );
              if (latestFormData) {
                const actualProduction = parseFloat(
                  latestFormData.actual_production
                );
                const targetQty = parseFloat(latestFormData.target_qty);
                shouldTrigger =
                  !isNaN(actualProduction) &&
                  !isNaN(targetQty) &&
                  (actualProduction / targetQty) * 100 < 85;
              } else {
                shouldTrigger = false;
              }
            } else {
              shouldTrigger = true;
            }
            break;
          }
          case "task_completed": {
            shouldTrigger = true;
            break;
          }
          default:
            shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        task.status = "pending";
        task.lastUpdated = new Date().toISOString();
      }
    }
  }
}

// Check conditional triggers based on form data from dependent tasks
async function checkConditionalTrigger(task, process) {
  try {
    if (process.name === "Production Planning Workflow") {
      // Action plan tasks - check if production report shows < 85% achievement
      if (
        task.formId === "F-ACTION-PLAN" &&
        task.trigger &&
        task.trigger.event === "task_completed_and_condition_satisfied"
      ) {
        const dependentTaskId = task.trigger.taskId;
        const dependentTask = process.tasks.find(
          (t) => t.id === dependentTaskId
        );

        if (!dependentTask || dependentTask.status !== "completed") {
          return false;
        }

        const latestFormData = await getLatestFormDataForTask(dependentTaskId);
        if (!latestFormData) {
          return false;
        }

        const actualProduction = parseFloat(latestFormData.actual_production);
        const targetQty = parseFloat(latestFormData.target_qty);

        if (!isNaN(actualProduction) && !isNaN(targetQty)) {
          const achievementPercentage = (actualProduction / targetQty) * 100;
          return achievementPercentage < 85;
        }

        return false;
      }

      // Regular task completion triggers
      if (task.trigger && task.trigger.event === "task_completed") {
        const dependentTask = process.tasks.find(
          (t) => t.id === task.trigger.taskId
        );
        return dependentTask && dependentTask.status === "completed";
      }
    }

    return true;
  } catch (error) {
    console.error("Error in checkConditionalTrigger:", error);
    return true;
  }
}

module.exports = {
  validateFormData,
  analyzeFormDataAndTriggerTasks,
  triggerDependentTasks,
  checkConditionalTrigger,
  getLatestFormDataForTask,
};
