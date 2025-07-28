import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  fetchTasks,
  completeTask,
  updateTask,
} from "./services/api";
import { Routes, Route, useNavigate } from "react-router-dom";
import UserSelector from "./components/users/UserSelector/UserSelector";
import TaskList from "./components/tasks/TaskList/TaskList";
import SubmittedFormsPage from "./components/forms/SubmittedFormsPage";
import "./App.css";

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isUsersLoading, setUsersLoading] = useState(true);
  const [isTasksLoading, setTasksLoading] = useState(false);
  const [appError, setAppError] = useState(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const navigate = useNavigate();

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

  const handleComplete = async (taskId, options = {}) => {
    try {
      await completeTask(taskId);
      await loadTasks();
    } catch (err) {
      setAppError(`Failed to complete task: ${err.message}`);
      console.error(err);
    }
  };

  const handleUpdate = async (taskId) => {
    try {
      await updateTask(taskId);
      await loadTasks();
    } catch (err) {
      setAppError(`Failed to update task: ${err.message}`);
      console.error(err);
    }
  };

  // Filter tasks by type
  const filterTasksByType = (taskType) => {
    if (!tasks.length) return [];

    const taskFilters = {
      monthly: (task) => task.name.includes("Monthly Production Plan"),
      weekly: (task) => task.name.includes("Weekly Production Plan"),
      daily: (task) =>
        task.name.includes("Daily Production Plan") ||
        task.name.includes("Daily Production Report") ||
        task.name.includes("Action Plan"),
    };

    return tasks.filter(taskFilters[taskType] || (() => true));
  };

  const monthlyTasks = filterTasksByType("monthly");
  const weeklyTasks = filterTasksByType("weekly");
  const dailyTasks = filterTasksByType("daily");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Production Planning Task Management</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {appError && <div className="error-message">{appError}</div>}
                <UserSelector
                  users={users}
                  selectedUser={selectedUser}
                  onSelect={setSelectedUser}
                  isLoading={isUsersLoading}
                />
                <button
                  onClick={() =>
                    navigate("/submitted-forms?userId=" + selectedUser)
                  }
                  disabled={!selectedUser}
                  className="view-submissions-btn"
                >
                  View Submitted Forms
                </button>

                {selectedUser && !isTasksLoading && (
                  <div className="task-tabs">
                    <div className="tab-navigation">
                      <button
                        className={`tab-button ${
                          activeTab === "monthly" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("monthly")}
                      >
                        Monthly Tasks ({monthlyTasks.length})
                      </button>
                      <button
                        className={`tab-button ${
                          activeTab === "weekly" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("weekly")}
                      >
                        Weekly Tasks ({weeklyTasks.length})
                      </button>
                      <button
                        className={`tab-button ${
                          activeTab === "daily" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("daily")}
                      >
                        Daily Tasks ({dailyTasks.length})
                      </button>
                    </div>

                    <div className="tab-content">
                      {activeTab === "monthly" && (
                        <div className="tab-panel">
                          <h2>Monthly Production Planning</h2>
                          <TaskList
                            tasks={monthlyTasks}
                            onComplete={handleComplete}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      )}

                      {activeTab === "weekly" && (
                        <div className="tab-panel">
                          <h2>Weekly Production Planning</h2>
                          <TaskList
                            tasks={weeklyTasks}
                            onComplete={handleComplete}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      )}

                      {activeTab === "daily" && (
                        <div className="tab-panel">
                          <h2>Daily Production Planning & Reports</h2>
                          <TaskList
                            tasks={dailyTasks}
                            onComplete={handleComplete}
                            onUpdate={handleUpdate}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isTasksLoading && (
                  <div className="loading">Loading tasks...</div>
                )}
              </>
            }
          />
          <Route path="/submitted-forms" element={<SubmittedFormsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
