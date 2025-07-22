import React from "react";
import TaskItem from "./TaskItem";

export default function TaskList({ tasks, onComplete, onUpdate }) {
  return (
    <div>
      <h2>Your Tasks</h2>
      {tasks.length === 0 && <p>No tasks assigned.</p>}
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
