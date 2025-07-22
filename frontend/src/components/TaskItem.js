import React from "react";

export default function TaskItem({ task, onComplete, onUpdate }) {
  return (
    <div style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
      <h3>{task.name}</h3>
      <p>Status: {task.status}</p>
      <button
        onClick={() => onComplete(task.id)}
        disabled={task.status === "completed"}
      >
        Complete
      </button>
      <button onClick={() => onUpdate(task.id)}>Update</button>
    </div>
  );
}
