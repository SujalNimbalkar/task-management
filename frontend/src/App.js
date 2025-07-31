import React, { useState, useEffect } from "react";
import "./App.css";
import TaskList from "./components/tasks/TaskList/TaskList";
import AuthPage from "./components/auth/AuthPage";
import { fetchTasks, fetchUsers } from "./services/api";
import { useAuth } from "./contexts/AuthContext";
import {
  TIME_CATEGORIES,
  STATUS_CATEGORIES,
  getTimeCategoryIds,
  getStatusCategoryIds,
  filterTasksByTimeAndStatus,
  getTaskCountByTimeAndStatus,
  getTimeCategoryCounts,
  getStatusCategoryCounts,
  isTemplateTask,
} from "./utils/taskCategories";

function App() {
  const { databaseUser, loading: authLoading, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeCategory, setSelectedTimeCategory] = useState("all");
  const [selectedStatusCategory, setSelectedStatusCategory] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (err) {
        setError("Failed to load users");
        console.error("Error loading users:", err);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (databaseUser) {
      loadTasks();
    }
  }, [databaseUser]);

  const loadTasks = async () => {
    if (!databaseUser) return;

    setLoading(true);
    try {
      const tasksData = await fetchTasks(databaseUser.id.toString());
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      setError("Failed to load tasks");
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = () => {
    loadTasks();
  };

  const getTimeCategoryCount = (timeCategory) => {
    return getTaskCountByTimeAndStatus(
      tasks,
      timeCategory,
      selectedStatusCategory
    );
  };

  const getStatusCategoryCount = (statusCategory) => {
    return getTaskCountByTimeAndStatus(
      tasks,
      selectedTimeCategory,
      statusCategory
    );
  };

  const getTimeCategoryDisplayName = (timeCategory) => {
    return TIME_CATEGORIES[timeCategory]?.name || "All Time Periods";
  };

  const getStatusCategoryDisplayName = (statusCategory) => {
    return STATUS_CATEGORIES[statusCategory]?.name || "All Status";
  };

  const getTimeCategoryIcon = (timeCategory) => {
    return TIME_CATEGORIES[timeCategory]?.icon || "📅";
  };

  const getStatusCategoryIcon = (statusCategory) => {
    return STATUS_CATEGORIES[statusCategory]?.icon || "📋";
  };

  const getFilteredTasks = () => {
    return filterTasksByTimeAndStatus(
      tasks,
      selectedTimeCategory,
      selectedStatusCategory
    );
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Show auth page if user is not authenticated
  if (!databaseUser) {
    return <AuthPage />;
  }

  // Show error if there's an error loading data
  if (error) {
    return (
      <div className="App">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">Production Planning</h1>
            <p className="sidebar-subtitle">Task Management System</p>
          </div>
        </div>
        <div className="main-content">
          <div className="header">
            <h1>Production Planning Task Management</h1>
          </div>
          <div className="content-container">
            <div className="error-message">
              {error}
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginLeft: "1rem",
                  padding: "0.5rem 1rem",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Production Planning</h1>
          <p className="sidebar-subtitle">Task Management System</p>
        </div>

        <nav className="sidebar-nav">
          {/* Time Categories Section */}
          <div className="nav-section">
            <div className="nav-section-title">Time Categories</div>
            {getTimeCategoryIds().map((timeCategory) => (
              <div
                key={timeCategory}
                className={`nav-item ${
                  selectedTimeCategory === timeCategory ? "active" : ""
                }`}
                onClick={() => setSelectedTimeCategory(timeCategory)}
                data-category="time"
                data-value={timeCategory}
              >
                <span className="nav-item-icon">
                  {getTimeCategoryIcon(timeCategory)}
                </span>
                <span>{getTimeCategoryDisplayName(timeCategory)}</span>
                <span className="nav-item-count">
                  {getTimeCategoryCount(timeCategory)}
                </span>
              </div>
            ))}
          </div>

          {/* Status Categories Section */}
          <div className="nav-section">
            <div className="nav-section-title">Status Categories</div>
            {getStatusCategoryIds().map((statusCategory) => (
              <div
                key={statusCategory}
                className={`nav-item ${
                  selectedStatusCategory === statusCategory ? "active" : ""
                }`}
                onClick={() => setSelectedStatusCategory(statusCategory)}
                data-category="status"
                data-value={statusCategory}
              >
                <span className="nav-item-icon">
                  {getStatusCategoryIcon(statusCategory)}
                </span>
                <span>{getStatusCategoryDisplayName(statusCategory)}</span>
                <span className="nav-item-count">
                  {getStatusCategoryCount(statusCategory)}
                </span>
              </div>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">System</div>
            <div className="nav-item">
              <span className="nav-item-icon">⚙️</span>
              <span>Settings</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">📈</span>
              <span>Reports</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">❓</span>
              <span>Help</span>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className="hamburger-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>Production Planning Task Management</h1>
          </div>
          <div className="header-actions">
            <button
              className="logout-button"
              onClick={signOut}
              title="Sign Out"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        <div className="content-container">
          {/* User Info and Filter Display */}
          <div className="filter-display">
            <div className="user-info">
              <span className="user-label">Current User:</span>
              <span className="user-name">
                {databaseUser.name} (
                {databaseUser.roles
                  ? databaseUser.roles.join(", ")
                  : "No roles"}
                )
              </span>
            </div>
            <div className="active-filters">
              <span className="filter-label">Active Filters:</span>
              <span className="filter-badge time-filter">
                {getTimeCategoryDisplayName(selectedTimeCategory)}
              </span>
              <span className="filter-badge status-filter">
                {getStatusCategoryDisplayName(selectedStatusCategory)}
              </span>
              <span className="filter-count">
                {getFilteredTasks().length} tasks found
              </span>
            </div>
          </div>

          {/* Dual Filter Tabs */}
          <div className="dual-filter-tabs">
            {/* Time Filter Tabs */}
            <div className="filter-section">
              <h3>Time Period</h3>
              <div className="tab-navigation time-tabs">
                {getTimeCategoryIds().map((timeCategory) => (
                  <button
                    key={timeCategory}
                    className={`tab-button ${
                      selectedTimeCategory === timeCategory ? "active" : ""
                    }`}
                    onClick={() => setSelectedTimeCategory(timeCategory)}
                    data-category="time"
                    data-value={timeCategory}
                  >
                    {getTimeCategoryDisplayName(timeCategory)} (
                    {getTimeCategoryCount(timeCategory)})
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="filter-section">
              <h3>Status</h3>
              <div className="tab-navigation status-tabs">
                {getStatusCategoryIds().map((statusCategory) => (
                  <button
                    key={statusCategory}
                    className={`tab-button ${
                      selectedStatusCategory === statusCategory ? "active" : ""
                    }`}
                    onClick={() => setSelectedStatusCategory(statusCategory)}
                    data-category="status"
                    data-value={statusCategory}
                  >
                    {getStatusCategoryDisplayName(statusCategory)} (
                    {getStatusCategoryCount(statusCategory)})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="task-list-container">
            <div className="task-list">
              <h3>
                {getTimeCategoryDisplayName(selectedTimeCategory)} -{" "}
                {getStatusCategoryDisplayName(selectedStatusCategory)}
              </h3>
              {loading ? (
                <div className="loading">Loading tasks...</div>
              ) : (
                <TaskList
                  tasks={getFilteredTasks()}
                  onTaskUpdate={handleTaskUpdate}
                  currentUser={databaseUser}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
