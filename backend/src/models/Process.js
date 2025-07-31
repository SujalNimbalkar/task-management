const mongoose = require("mongoose");

// Schema for task triggers
const triggerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["time", "event", "manual"],
    },
    recurrence: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: function () {
        return this.type === "time";
      },
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      required: function () {
        return this.type === "time" && this.recurrence === "monthly";
      },
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: function () {
        return this.type === "time" && this.recurrence === "weekly";
      },
    },
    event: {
      type: String,
      required: function () {
        return this.type === "event";
      },
    },
    taskId: {
      type: String,
      required: function () {
        return this.type === "event" && this.event === "task_completed";
      },
    },
  },
  { _id: false }
);

// Schema for due date rules
const dueDateRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["fixed_days", "end_of_month_minus_days", "relative_to_trigger"],
    },
    days: {
      type: Number,
      required: true,
    },
    fixedDate: {
      type: Date,
      required: function () {
        return this.type === "fixed_days";
      },
    },
  },
  { _id: false }
);

// Schema for individual tasks
const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    assignedRole: {
      type: String,
      required: true,
      trim: true,
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in_progress", "completed", "overdue", "cancelled"],
      default: "pending",
    },
    dependencies: [
      {
        type: String,
        ref: "Task",
      },
    ],
    formId: {
      type: String,
      required: true,
      trim: true,
    },
    trigger: {
      type: triggerSchema,
      required: true,
    },
    dueDateRule: {
      type: dueDateRuleSchema,
    },
    dueDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: null,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateId: {
      type: String,
      ref: "Task",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    estimatedHours: Number,
    actualHours: Number,
    comments: [
      {
        text: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Schema for processes/workflows
const processSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tasks: [taskSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for task count
processSchema.virtual("taskCount").get(function () {
  return this.tasks ? this.tasks.length : 0;
});

// Virtual for completed task count
processSchema.virtual("completedTaskCount").get(function () {
  return this.tasks
    ? this.tasks.filter((task) => task.status === "completed").length
    : 0;
});

// Method to get task by ID
processSchema.methods.getTaskById = function (taskId) {
  return this.tasks.find((task) => task.taskId === taskId);
};

// Method to update task status
processSchema.methods.updateTaskStatus = function (
  taskId,
  status,
  userId = null
) {
  const task = this.getTaskById(taskId);
  if (task) {
    task.status = status;
    task.lastUpdated = new Date();
    if (status === "completed") {
      task.completedDate = new Date();
    }
    if (userId) {
      task.assignedUserId = userId;
    }
    return this.save();
  }
  return null;
};

// Static method to find active processes
processSchema.statics.findActiveProcesses = function () {
  return this.find({ isActive: true });
};

// Static method to find processes by category
processSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true });
};

// Static method to find tasks by status
processSchema.statics.findTasksByStatus = function (status) {
  return this.aggregate([
    { $unwind: "$tasks" },
    { $match: { "tasks.status": status } },
    { $project: { process: "$$ROOT", task: "$tasks" } },
  ]);
};

// Static method to find overdue tasks
processSchema.statics.findOverdueTasks = function () {
  const now = new Date();
  return this.aggregate([
    { $unwind: "$tasks" },
    {
      $match: {
        "tasks.status": { $in: ["pending", "in_progress"] },
        "tasks.dueDate": { $lt: now },
      },
    },
    { $project: { process: "$$ROOT", task: "$tasks" } },
  ]);
};

const Process = mongoose.model("Process", processSchema);

module.exports = Process;
