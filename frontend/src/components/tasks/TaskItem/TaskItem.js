import React, { useState } from "react";
import {
  completeTask,
  approveDailyTask,
  rejectDailyTask,
  reassignDailyTask,
  exportTaskToPDF,
  deleteTask,
} from "../../../services/api";
import { getApiUrl } from "../../../config/api";
import DynamicForm from "../../forms/DynamicForm/DynamicForm";
import { isTaskTemplate } from "../../../utils/taskCategories";
import "./TaskItem.css";

const TaskItem = ({ task, onTaskUpdate, currentUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPlantHead =
    currentUser &&
    currentUser.roles &&
    currentUser.roles.includes("plant_head");
  const isDailyTask = task.name && task.name.includes("Daily Production Plan");
  const canAct =
    isPlantHead &&
    isDailyTask &&
    (task.status === "in_process" || task.status === "pending");

  // Check if task is a template (should not be deleted)
  const isTemplate = isTaskTemplate(task);

  // Check if user can delete tasks (admin or plant_head)
  const canDelete =
    currentUser &&
    (currentUser.roles.includes("admin") ||
      currentUser.roles.includes("plant_head"));

  const handleComplete = async () => {
    if (isSubmitting) return;

    console.log("Complete button clicked for task:", task.id);
    console.log(
      "Form submitted:",
      formSubmitted,
      "Task form data:",
      task.formData
    );

    // If form is not submitted by user, expand the task and show form
    if (!formSubmitted) {
      console.log("Opening form for task:", task.id);
      setIsExpanded(true);
      return;
    }

    console.log("Completing task:", task.id);
    setIsSubmitting(true);
    try {
      await completeTask(task.id);
      onTaskUpdate();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to complete task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    await approveDailyTask(task.id);
    onTaskUpdate();
  };
  const handleReject = async () => {
    await rejectDailyTask(task.id);
    onTaskUpdate();
  };
  const handleReassign = async () => {
    // Reassign to the same Production Manager (no new manager needed)
    await reassignDailyTask(task.id, null);
    onTaskUpdate();
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the task "${task.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onTaskUpdate();
      alert("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      if (error.error) {
        alert(`Failed to delete task: ${error.error}`);
      } else {
        alert("Failed to delete task. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(getApiUrl(`tasks/${task.id}/export-excel`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${task.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportTaskToPDF(task.id);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    }
  };

  // Determine form mode based on task type
  const getFormMode = () => {
    console.log("=== FORM MODE DEBUG ===");
    console.log("Task name:", task.name);
    console.log("Form name:", task.form?.name);
    console.log(
      "Task name includes 'monthly':",
      task.name?.toLowerCase().includes("monthly")
    );
    console.log(
      "Task name includes 'weekly':",
      task.name?.toLowerCase().includes("weekly")
    );

    // Determine form mode
    let formMode = "plan";
    if (
      task.form &&
      (task.form.name === "F-PRODUCTION-PLAN-ENTRY" ||
        task.form.name === "Production Plan Entry")
    ) {
      if (task.name && task.name.toLowerCase().includes("monthly")) {
        formMode = "monthly";
        console.log("✅ Setting mode to 'monthly'");
      } else if (task.name && task.name.toLowerCase().includes("weekly")) {
        formMode = "weekly";
        console.log("✅ Setting mode to 'weekly'");
      } else {
        console.log("❌ No monthly/weekly found, keeping 'plan'");
      }
    } else if (task.name && task.name.toLowerCase().includes("report")) {
      formMode = "report";
      console.log("✅ Setting mode to 'report'");
    } else {
      console.log("❌ No conditions met, keeping 'plan'");
    }
    console.log("Final formMode:", formMode);
    console.log("=== END FORM MODE DEBUG ===");
    return formMode;
  };

  const formMode = getFormMode();

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="task-item">
      <div className="task-header">
        <div className="task-title-section">
          <h3 className="task-title">{task.name}</h3>
          <span className={`task-status ${task.status}`}>{task.status}</span>
        </div>

        <div className="task-actions">
          {task.status !== "completed" && !formSubmitted && (
            <button
              className="complete-btn open-form"
              onClick={handleComplete}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Completing..."
                : task.name.includes("Monthly")
                ? "Open Monthly Plan"
                : task.name.includes("Weekly")
                ? "Open Weekly Plan"
                : "Open & Fill Form"}
            </button>
          )}

          <button
            className="export-btn"
            onClick={handleExportExcel}
            disabled={!task.formData}
          >
            Export Excel
          </button>

          <button
            className="export-btn"
            onClick={handleExportPDF}
            disabled={!task.formData}
          >
            Export PDF
          </button>

          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>

          {/* Delete button - only show for non-template tasks and users with delete permissions */}
          {canDelete && !isTemplate && (
            <button
              className="delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Task"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {canAct && (
            <div className="plant-head-actions">
              <button onClick={handleApprove}>Approve</button>
              <button onClick={handleReject}>Reject</button>
              <button onClick={handleReassign}>Reassign</button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="task-details">
          <div className="task-info">
            <div className="task-info-item">
              <span className="task-info-label">Task ID</span>
              <span className="task-info-value">{task.id}</span>
            </div>
            <div className="task-info-item">
              <span className="task-info-label">Assigned Role</span>
              <span className="task-info-value">{task.assignedRole}</span>
            </div>
            {task.assignedUser && (
              <div className="task-info-item">
                <span className="task-info-label">Assigned User</span>
                <span className="task-info-value">
                  {task.assignedUser.name} ({task.assignedUser.employeeId})
                </span>
              </div>
            )}
            {task.assignedUser && (
              <div className="task-info-item">
                <span className="task-info-label">Department</span>
                <span className="task-info-value">
                  {task.assignedUser.department}
                </span>
              </div>
            )}
            {task.assignedUser && (
              <div className="task-info-item">
                <span className="task-info-label">Designation</span>
                <span className="task-info-value">
                  {task.assignedUser.designation}
                </span>
              </div>
            )}
            <div className="task-info-item">
              <span className="task-info-label">Created</span>
              <span className="task-info-value">
                {formatDate(task.createdAt)}
              </span>
            </div>
            <div className="task-info-item">
              <span className="task-info-label">Last Updated</span>
              <span className="task-info-value">
                {formatDate(task.lastUpdated)}
              </span>
            </div>
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="task-info-item">
                <span className="task-info-label">Dependencies</span>
                <span className="task-info-value">
                  {task.dependencies.join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="form-container">
            <DynamicForm
              key={`${task.id}-${formMode}`}
              formDefinition={task.form}
              initialData={task.formData}
              taskId={task.id}
              mode={formMode}
              onSubmit={async (formData) => {
                setFormSubmitted(true);
                setIsSubmitting(true);
                try {
                  // Submit the form to the backend
                  const { submitTaskForm } = await import(
                    "../../../services/api"
                  );

                  // Add submittedBy field for MongoDB
                  const submissionData = {
                    ...formData,
                    submittedBy: currentUser?.id || "688b05ff8be0df0fdc385cb5",
                  };

                  await submitTaskForm(task.id, submissionData);
                  onTaskUpdate();
                  const taskType = task.name.includes("Monthly")
                    ? "Monthly"
                    : task.name.includes("Weekly")
                    ? "Weekly"
                    : "Daily";
                  alert(
                    `${taskType} production plan submitted and task completed successfully!`
                  );
                } catch (error) {
                  console.error("Error submitting form:", error);
                  alert("Form submission failed. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
