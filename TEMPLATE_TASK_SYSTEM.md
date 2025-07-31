# Template-Based Task System and Deletion Functionality

## Overview

This document describes the implementation of a template-based task system where monthly production plans use templates to create new tasks with independent data storage, and includes task deletion functionality.

## Key Features

### 1. Template-Based Task Creation

Each monthly production plan now uses a template system to create new tasks with independent data storage:

- **Template Tasks**: Tasks with IDs 1001 (Monthly), 2001 (Weekly), 2002 (Daily) serve as templates
- **Independent Data**: Each created task maintains its own form data without affecting other tasks
- **Template Protection**: Template tasks cannot be deleted to preserve the system's functionality

### 2. Independent Data Storage

Each task created from a template maintains its own independent data:

- **Deep Copying**: When monthly plan data is copied to weekly tasks, a deep copy is created
- **Data Isolation**: Changes to one task's data do not affect other tasks
- **Form Data Independence**: Each task has its own `formData` object with unique content

### 3. Task Deletion Functionality

A comprehensive task deletion system has been implemented:

- **Backend API**: `DELETE /api/tasks/:id` endpoint for task deletion
- **Frontend Integration**: Delete button in TaskItem component
- **Safety Checks**: Prevents deletion of template tasks and tasks with dependencies
- **Data Cleanup**: Removes related form submissions when tasks are deleted

## Implementation Details

### Backend Changes

#### 1. Task Controller (`backend/src/controllers/taskController.js`)

Added `deleteTask` function with the following features:

```javascript
const deleteTask = async (req, res) => {
  // Template protection
  if (task.id === 1001 || task.id === 2001 || task.id === 2002) {
    return res.status(400).json({
      error:
        "Cannot delete template tasks. Template tasks are used to create new tasks.",
    });
  }

  // Dependency check
  const dependentTasks = process.tasks.filter(
    (t) => t.dependencies && t.dependencies.includes(task.id)
  );

  // Data cleanup
  formsDb.submissions = formsDb.submissions.filter(
    (submission) => submission.taskId !== String(taskId)
  );
};
```

#### 2. Task Routes (`backend/src/routes/taskRoutes.js`)

Added delete route:

```javascript
router.delete("/:id", deleteTask);
```

#### 3. Recurring Tasks (`backend/src/jobs/recurringTasks.js`)

Enhanced monthly task creation with template system:

```javascript
const newMonthlyTask = {
  id: newTaskId,
  name: `Monthly Production Plan - ${monthName} ${year}`,
  formData: {
    month_start_date: monthStartDate,
    rows: [], // Initialize with empty rows for independent data
  },
  isTemplate: false, // Mark as non-template
  templateId: task.id, // Reference to the template that created this task
};
```

### Frontend Changes

#### 1. API Service (`frontend/src/services/api.js`)

Added delete task function:

```javascript
export async function deleteTask(taskId) {
  const url = `${API_BASE_URL}${BASE_TASKS_PATH}/${taskId}`;
  return fetchWithFallback(url, { method: "DELETE" });
}
```

#### 2. TaskItem Component (`frontend/src/components/tasks/TaskItem/TaskItem.js`)

Added delete functionality:

```javascript
const handleDelete = async () => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete the task "${task.name}"? This action cannot be undone.`
  );

  if (!confirmDelete) return;

  await deleteTask(task.id);
  onTaskUpdate();
};
```

#### 3. Task Categories Utility (`frontend/src/utils/taskCategories.js`)

Added template identification functions:

```javascript
export const isTaskTemplate = (task) => {
  if (task.id === 1001 || task.id === 2001 || task.id === 2002) return true;
  if (task.isTemplate === true) return true;
  return false;
};
```

## Database Schema Changes

### Task Object Structure

Tasks now include additional properties:

```javascript
{
  id: 1234567890,
  name: "Monthly Production Plan - August 2025",
  isTemplate: false,           // New: identifies template vs created tasks
  templateId: 1001,           // New: references the template that created this task
  formData: {
    month_start_date: "2025-08-01",
    rows: []                   // Independent data for each task
  },
  createdForMonth: "2025-08"  // New: tracks which month this task was created for
}
```

## Usage Examples

### 1. Creating Tasks from Templates

The system automatically creates new tasks from templates:

1. **Monthly Trigger**: On the 30th of each month, a new monthly task is created
2. **Template Reference**: New tasks reference their template via `templateId`
3. **Independent Data**: Each task starts with empty `formData.rows`

### 2. Deleting Tasks

Users can delete tasks through the frontend:

1. **Permission Check**: Only admin and plant_head users can delete tasks
2. **Template Protection**: Template tasks (IDs 1001, 2001, 2002) cannot be deleted
3. **Dependency Check**: Tasks with dependent tasks cannot be deleted
4. **Data Cleanup**: Related form submissions are automatically removed

### 3. Data Independence

Each task maintains independent data:

```javascript
// Monthly task data
monthlyTask.formData = {
  month_start_date: "2025-08-01",
  rows: [{ item_name: "Product A", monthly_qty: "1000", weekly_qty: "" }],
};

// Weekly task data (independent copy)
weeklyTask.formData = {
  month_start_date: "2025-08-01",
  rows: [{ item_name: "Product A", monthly_qty: "1000", weekly_qty: "250" }],
};
```

## Security and Validation

### 1. Template Protection

- Template tasks (IDs 1001, 2001, 2002) are protected from deletion
- Frontend hides delete button for template tasks
- Backend validates template protection before deletion

### 2. Dependency Validation

- Tasks with dependent tasks cannot be deleted
- System provides clear error messages about dependencies
- Users must delete dependent tasks first

### 3. Permission Control

- Only admin and plant_head users can delete tasks
- Frontend checks user permissions before showing delete button
- Backend validates user permissions

## Error Handling

### 1. Template Deletion Attempt

```javascript
// Response when trying to delete template task
{
  "error": "Cannot delete template tasks. Template tasks are used to create new tasks."
}
```

### 2. Dependent Task Error

```javascript
// Response when trying to delete task with dependencies
{
  "error": "Cannot delete task. It has 3 dependent task(s) that must be deleted first.",
  "dependentTasks": [
    { "id": 1234567891, "name": "Weekly Production Plan - Week 1" },
    { "id": 1234567892, "name": "Weekly Production Plan - Week 2" }
  ]
}
```

## Testing

### 1. Manual Testing

Run the test script to verify functionality:

```bash
cd backend
node test-task-deletion.js
```

### 2. Frontend Testing

1. Log in as admin or plant_head user
2. Navigate to tasks list
3. Verify delete button appears for non-template tasks
4. Verify delete button is hidden for template tasks
5. Test deletion with confirmation dialog

## Future Enhancements

### 1. Bulk Operations

- Bulk delete multiple tasks
- Bulk create tasks from templates

### 2. Advanced Template System

- Custom template creation
- Template versioning
- Template inheritance

### 3. Data Archival

- Archive deleted tasks instead of permanent deletion
- Restore functionality for archived tasks
- Data retention policies

## Conclusion

The template-based task system provides a robust foundation for creating independent tasks with isolated data storage. The deletion functionality ensures proper data management while protecting critical template tasks. The system maintains data integrity and provides clear user feedback for all operations.
