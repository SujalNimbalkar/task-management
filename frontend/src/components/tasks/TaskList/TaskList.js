import React from "react";
import TaskItem from "../TaskItem/TaskItem";
import "./TaskList.css";

const TaskList = ({ tasks, onComplete, onUpdate }) => {
  if (!tasks.length) {
    return (
      <div className="task-list-empty">
        <p>No tasks assigned.</p>
      </div>
    );
  }

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
