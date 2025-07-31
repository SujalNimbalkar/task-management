// Task Categories Configuration - Dual Filter System
export const TIME_CATEGORIES = {
  all: {
    id: "all",
    name: "All Time Periods",
    icon: "📅",
    color: "#3498db",
    description: "View tasks from all time periods",
  },
  monthly: {
    id: "monthly",
    name: "Monthly Tasks",
    icon: "📅",
    color: "#3498db",
    description: "Monthly production plans and reports",
  },
  weekly: {
    id: "weekly",
    name: "Weekly Tasks",
    icon: "📊",
    color: "#e67e22",
    description: "Weekly production plans and reports",
  },
  daily: {
    id: "daily",
    name: "Daily Tasks",
    icon: "📋",
    color: "#27ae60",
    description: "Daily production plans and action items",
  },
};

export const STATUS_CATEGORIES = {
  all: {
    id: "all",
    name: "All Status",
    icon: "📋",
    color: "#95a5a6",
    description: "View tasks with any status",
  },
  completed: {
    id: "completed",
    name: "Completed",
    icon: "✅",
    color: "#27ae60",
    description: "Tasks that have been successfully completed",
  },
  pending: {
    id: "pending",
    name: "Pending",
    icon: "⏳",
    color: "#f39c12",
    description: "Tasks waiting to be started",
  },
  in_progress: {
    id: "in_progress",
    name: "In Progress",
    icon: "🔄",
    color: "#e67e22",
    description: "Tasks currently being worked on",
  },
  rejected: {
    id: "rejected",
    name: "Rejected",
    icon: "❌",
    color: "#e74c3c",
    description: "Tasks that have been rejected",
  },
  reopened: {
    id: "reopened",
    name: "Reopened",
    icon: "🔄",
    color: "#9b59b6",
    description: "Tasks that have been reopened for review",
  },
};

// Helper function to get category by ID
export const getTimeCategoryById = (id) => {
  return TIME_CATEGORIES[id] || TIME_CATEGORIES.all;
};

export const getStatusCategoryById = (id) => {
  return STATUS_CATEGORIES[id] || STATUS_CATEGORIES.all;
};

// Helper function to get all categories
export const getAllTimeCategories = () => {
  return Object.values(TIME_CATEGORIES);
};

export const getAllStatusCategories = () => {
  return Object.values(STATUS_CATEGORIES);
};

// Helper function to get category IDs
export const getTimeCategoryIds = () => {
  return Object.keys(TIME_CATEGORIES);
};

export const getStatusCategoryIds = () => {
  return Object.keys(STATUS_CATEGORIES);
};

// Helper function to check if task is template
export const isTemplateTask = (task) => {
  // Monthly template: id 1001 and exact name
  if (task.name === "Monthly Production Plan" && task.id === 1001) return true;
  // Weekly template: name without week number or id 2001 and generic name
  if (task.name === "Weekly Production Plan" && task.id === 2001) return true;
  // Daily template: name without week/day or id 2002 and generic name
  if (task.name === "Daily Production Plan" && task.id === 2002) return true;
  return false;
};

// Helper function to check if task is a template (improved version)
export const isTaskTemplate = (task) => {
  // Check by ID (template IDs)
  if (task.id === 1001 || task.id === 2001 || task.id === 2002) return true;

  // Check by name pattern (generic names without specific month/week/day)
  if (task.name === "Monthly Production Plan" && !task.name.includes("-"))
    return true;
  if (task.name === "Weekly Production Plan" && !task.name.includes("Week"))
    return true;
  if (task.name === "Daily Production Plan" && !task.name.includes("Day"))
    return true;

  // Check by isTemplate property
  if (task.isTemplate === true) return true;

  return false;
};

// Helper function to get template ID for a task
export const getTemplateId = (task) => {
  if (task.name && task.name.includes("Monthly")) return 1001;
  if (task.name && task.name.includes("Weekly")) return 2001;
  if (task.name && task.name.includes("Daily")) return 2002;
  return null;
};

// Helper function to determine task time category
export const getTaskTimeCategory = (task) => {
  if (task.name.includes("Monthly Production Plan")) return "monthly";
  if (task.name.includes("Weekly Production Plan")) return "weekly";
  if (
    task.name.includes("Daily Production") ||
    task.name.includes("Action Plan")
  )
    return "daily";
  return "all";
};

// Helper function to filter tasks by both time and status
export const filterTasksByTimeAndStatus = (
  tasks,
  timeCategory,
  statusCategory
) => {
  const nonTemplateTasks = tasks.filter((task) => !isTaskTemplate(task));

  let filteredTasks = nonTemplateTasks;

  // Filter by time category
  if (timeCategory !== "all") {
    filteredTasks = filteredTasks.filter(
      (task) => getTaskTimeCategory(task) === timeCategory
    );
  }

  // Filter by status category
  if (statusCategory !== "all") {
    filteredTasks = filteredTasks.filter(
      (task) => task.status === statusCategory
    );
  }

  return filteredTasks;
};

// Helper function to get task count by time and status
export const getTaskCountByTimeAndStatus = (
  tasks,
  timeCategory,
  statusCategory
) => {
  return filterTasksByTimeAndStatus(tasks, timeCategory, statusCategory).length;
};

// Helper function to get all task counts for time categories
export const getTimeCategoryCounts = (tasks, statusCategory = "all") => {
  const counts = {};
  getTimeCategoryIds().forEach((timeCategory) => {
    counts[timeCategory] = getTaskCountByTimeAndStatus(
      tasks,
      timeCategory,
      statusCategory
    );
  });
  return counts;
};

// Helper function to get all task counts for status categories
export const getStatusCategoryCounts = (tasks, timeCategory = "all") => {
  const counts = {};
  getStatusCategoryIds().forEach((statusCategory) => {
    counts[statusCategory] = getTaskCountByTimeAndStatus(
      tasks,
      timeCategory,
      statusCategory
    );
  });
  return counts;
};
