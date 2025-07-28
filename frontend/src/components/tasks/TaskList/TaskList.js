import React from "react";
import TaskItem from "../TaskItem/TaskItem";
import "./TaskList.css";

// Helper to build a task map and tree
function buildTaskTree(tasks) {
  const taskMap = {};
  tasks.forEach((task) => {
    taskMap[task.id] = { ...task, subtasks: [] };
  });
  tasks.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((depId) => {
        if (taskMap[depId]) {
          taskMap[depId].subtasks.push(taskMap[task.id]);
        }
      });
    }
  });
  // Only return root tasks (no dependencies)
  return tasks
    .filter((task) => !task.dependencies || task.dependencies.length === 0)
    .map((task) => taskMap[task.id]);
}

// Helper to check trigger condition for Action Plan
function shouldShowSubtask(masterTask, subtask) {
  // Example: Action Plan for Production Target Below 85%
  if (
    subtask.name === "Action Plan for Production Target Below 85%" &&
    masterTask.formData
  ) {
    const actual = parseFloat(masterTask.formData.actual_production);
    const target = parseFloat(masterTask.formData.production_target);
    if (!isNaN(actual) && !isNaN(target)) {
      return (actual / target) * 100 < 85;
    }
    return false;
  }
  // Default: show subtask if master is completed
  return masterTask.status === "completed";
}

function TaskTree({ task, onComplete, onUpdate }) {
  return (
    <div style={{ marginLeft: 20 }}>
      <TaskItem task={task} onComplete={onComplete} onUpdate={onUpdate} />
      {task.subtasks &&
        task.subtasks.length > 0 &&
        task.subtasks.map((subtask) =>
          shouldShowSubtask(task, subtask) ? (
            <TaskTree
              key={subtask.id}
              task={subtask}
              onComplete={onComplete}
              onUpdate={onUpdate}
            />
          ) : null
        )}
    </div>
  );
}

const TaskList = ({ tasks, onComplete, onUpdate }) => {
  if (!tasks.length) {
    return (
      <div className="task-list-empty">
        <p>No tasks assigned.</p>
      </div>
    );
  }

  // For the tabbed interface, show all tasks directly without tree structure
  return (
    <div className="task-list">
      <h2>Your Tasks</h2>
      <div className="task-list-items">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onComplete={onComplete}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
