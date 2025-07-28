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

      // Close form and refresh task list (always re-fetch after form submission)
      setShowForm(false);
      // Pass a second argument to indicate this is a form submission
      onComplete(task.id, { fromForm: true });
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

  const handleExportExcel = async () => {
    try {
      setError(null);
      const response = await fetch(
        `http://localhost:4000/api/tasks/${task.id}/export-excel`
      );

      if (!response.ok) {
        throw new Error("Failed to export Excel file");
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${task.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  // Determine form mode
  let formMode = "plan";
  if (task.form && task.form.name === "Production Plan Entry") {
    if (task.name && task.name.toLowerCase().includes("monthly")) {
      formMode = "monthly";
    } else if (task.name && task.name.toLowerCase().includes("weekly")) {
      formMode = "weekly";
    }
  } else if (task.name && task.name.toLowerCase().includes("report")) {
    formMode = "report";
  }

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
        {task.trigger && (
          <div className="trigger-info">
            <p className="trigger-type">
              <strong>Trigger:</strong> {task.trigger.type}
              {task.trigger.event && ` - ${task.trigger.event}`}
            </p>
            {task.trigger.taskId && (
              <p className="trigger-dependency">
                <strong>Depends on:</strong> Task {task.trigger.taskId}
              </p>
            )}
          </div>
        )}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="dependencies">
            <p>
              <strong>Dependencies:</strong>
            </p>
            <ul>
              {task.dependencies.map((depId) => (
                <li key={depId}>Task {depId}</li>
              ))}
            </ul>
          </div>
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
                mode={formMode}
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
        <Button
          onClick={handleExportExcel}
          variant="secondary"
          disabled={!task.formData}
        >
          Export Excel
        </Button>
      </div>
    </div>
  );
};

export default TaskItem;
