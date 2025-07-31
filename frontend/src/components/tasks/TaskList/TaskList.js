import React from "react";
import TaskItem from "../TaskItem/TaskItem";
import "./TaskList.css";

const TaskList = ({ tasks, onTaskUpdate, currentUser }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="no-tasks">
          <p>No tasks available for this category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onTaskUpdate={onTaskUpdate}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
};

export default TaskList;
