import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  fetchTasks,
  completeTask,
  updateTask,
} from "./services/api";
import UserSelector from "./components/users/UserSelector/UserSelector";
import TaskList from "./components/tasks/TaskList/TaskList";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isUsersLoading, setUsersLoading] = useState(true);
  const [isTasksLoading, setTasksLoading] = useState(false);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setAppError("Failed to load users");
        console.error(err);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  const loadTasks = useCallback(async () => {
    if (!selectedUser) {
      setTasks([]);
      return;
    }
    try {
      setAppError(null);
      setTasksLoading(true);
      const data = await fetchTasks(selectedUser);
      setTasks(data);
    } catch (err) {
      setAppError(`Failed to load tasks: ${err.message}`);
      console.error(err);
    } finally {
      setTasksLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async (taskId) => {
    const originalTasks = [...tasks];

    // Optimistically update the UI
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: "completed" } : task
    );
    setTasks(updatedTasks);

    try {
      await completeTask(taskId);
    } catch (err) {
      setAppError(`Failed to complete task: ${err.message}`);
      console.error(err);
      // Revert to the original state on failure
      setTasks(originalTasks);
    }
  };

  const handleUpdate = async (taskId) => {
    const originalTasks = [...tasks];

    // Optimistically update the UI
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: "reopened" } : task
    );
    setTasks(updatedTasks);

    try {
      await updateTask(taskId);
    } catch (err) {
      setAppError(`Failed to update task: ${err.message}`);
      console.error(err);
      // Revert to the original state on failure
      setTasks(originalTasks);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Employee Task Dashboard</h1>
      </header>
      <main className="app-main">
        {appError && <div className="error-message">{appError}</div>}
        <UserSelector
          users={users}
          selectedUser={selectedUser}
          onSelect={setSelectedUser}
          isLoading={isUsersLoading}
        />
        {isTasksLoading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={tasks}
            onComplete={handleComplete}
            onUpdate={handleUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;
