import React, { useState } from "react";
import Button from "../../common/Button/Button";
import DynamicForm from "../../forms/DynamicForm/DynamicForm";
import { submitTaskForm } from "../../../services/api";
import "./TaskItem.css";

const TaskItem = ({ task, onComplete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await submitTaskForm(task.id, formData);

      // Close form and refresh task list
      setShowForm(false);
      onComplete(task.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setError(null);
      await onComplete(task.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      setError(null);
      await onUpdate(task.id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="task-item">
      <div className="task-info">
        <div className="task-header">
          <h3>{task.name}</h3>
          <span className={`status ${task.status}`}>{task.status}</span>
        </div>
        {task.processName && (
          <p className="process-name">Process: {task.processName}</p>
        )}
        {task.groupName && (
          <p className="group-name">Group: {task.groupName}</p>
        )}
        {task.recurrence && (
          <p className="recurrence">
            {task.recurrence === "daily"
              ? `Daily at ${task.timeOfDay}`
              : `Monthly on ${task.dayOfMonth}`}
          </p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {task.form && (
        <div className="task-form">
          <Button onClick={() => setShowForm(!showForm)} variant="secondary">
            {showForm ? "Hide Form" : "Show Form"}
          </Button>

          {showForm && (
            <div className="form-container">
              <DynamicForm
                formDefinition={task.form}
                initialData={task.formData}
                onSubmit={handleFormSubmit}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      )}

      <div className="task-actions">
        <Button
          onClick={handleComplete}
          disabled={
            task.status === "completed" || (task.form && !task.formData)
          }
          variant="primary"
        >
          Complete
        </Button>
        <Button onClick={handleUpdate} variant="secondary">
          Update
        </Button>
      </div>
    </div>
  );
};

export default TaskItem;
