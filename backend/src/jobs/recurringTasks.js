const { readDB, writeDB } = require("../utils/dbHelper");
const cron = require("node-cron");

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

cron.schedule("* * * * *", async () => {
  try {
    const db = await readDB();
    let changed = false;

    for (const process of db.processes) {
      if (!process.tasks) continue;

      for (const task of process.tasks) {
        if (
          !task.trigger ||
          task.status !== "completed" ||
          task.trigger.type !== "time"
        )
          continue;

        const now = new Date();

        if (task.trigger.recurrence === "daily") {
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
        } else if (task.trigger.recurrence === "monthly") {
          // Special handling for production planning workflow
          if (task.id === 1001 && task.trigger.dayOfMonth === "28") {
            // Monthly Production Plan - trigger 3 days before end of month
            if (
              isThreeDaysBeforeEndOfMonth() &&
              (!task.lastUpdated || !isThisMonth(task.lastUpdated))
            ) {
              task.status = "pending";
              task.lastUpdated = now.toISOString();
              changed = true;
              console.log(
                "[CRON] Monthly Production Plan triggered (3 days before end of month)"
              );
            }
          } else {
            // Regular monthly tasks
            if (!task.lastUpdated || !isThisMonth(task.lastUpdated)) {
              task.status = "pending";
              task.lastUpdated = now.toISOString();
              changed = true;
            }
          }
        }
      }
    }

    if (changed) {
      await writeDB(db);
      console.log("[CRON] Recurring tasks reset to pending where needed.");
    }
  } catch (err) {
    console.error("[CRON] Error resetting recurring tasks:", err);
  }
});
