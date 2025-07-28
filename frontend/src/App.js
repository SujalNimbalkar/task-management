import React, { useState, useEffect } from "react";
import "./App.css";
import TaskList from "./components/tasks/TaskList/TaskList";
import { fetchTasks, fetchUsers } from "./services/api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers();
        setUsers(usersData);
        if (usersData.length > 0) {
          setSelectedUser(usersData[0].id.toString());
        }
      } catch (err) {
        setError("Failed to load users");
        console.error("Error loading users:", err);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadTasks();
    }
  }, [selectedUser]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await fetchTasks(selectedUser);
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

  const filterTasksByType = (type) => {
    switch (type) {
      case "monthly":
        return tasks.filter((task) =>
          task.name.includes("Monthly Production Plan")
        );
      case "weekly":
        return tasks.filter((task) =>
          task.name.includes("Weekly Production Plan")
        );
      case "daily":
        return tasks.filter(
          (task) =>
            task.name.includes("Daily Production") ||
            task.name.includes("Action Plan")
        );
      default:
        return tasks;
    }
  };

  const getTabCount = (type) => {
    return filterTasksByType(type).length;
  };

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
          <div className="nav-section">
            <div className="nav-section-title">Task Categories</div>
            <div
              className={`nav-item ${activeTab === "monthly" ? "active" : ""}`}
              onClick={() => setActiveTab("monthly")}
            >
              <span className="nav-item-icon">📅</span>
              <span>Monthly Tasks</span>
              <span className="nav-item-count">{getTabCount("monthly")}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "weekly" ? "active" : ""}`}
              onClick={() => setActiveTab("weekly")}
            >
              <span className="nav-item-icon">📊</span>
              <span>Weekly Tasks</span>
              <span className="nav-item-count">{getTabCount("weekly")}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "daily" ? "active" : ""}`}
              onClick={() => setActiveTab("daily")}
            >
              <span className="nav-item-icon">📋</span>
              <span>Daily Tasks</span>
              <span className="nav-item-count">{getTabCount("daily")}</span>
            </div>
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
        </div>

        <div className="content-container">
          <div className="user-selector">
            <label htmlFor="user-select">Select User:</label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="task-tabs">
            <div className="tab-navigation">
              <button
                className={`tab-button ${
                  activeTab === "monthly" ? "active" : ""
                }`}
                onClick={() => setActiveTab("monthly")}
              >
                Monthly Tasks ({getTabCount("monthly")})
              </button>
              <button
                className={`tab-button ${
                  activeTab === "weekly" ? "active" : ""
                }`}
                onClick={() => setActiveTab("weekly")}
              >
                Weekly Tasks ({getTabCount("weekly")})
              </button>
              <button
                className={`tab-button ${
                  activeTab === "daily" ? "active" : ""
                }`}
                onClick={() => setActiveTab("daily")}
              >
                Daily Tasks ({getTabCount("daily")})
              </button>
            </div>

            <div className="tab-content">
              <div
                className={`tab-panel ${
                  activeTab === "monthly" ? "active" : ""
                }`}
              >
                <div className="task-list">
                  <h3>Monthly Production Plans</h3>
                  {loading ? (
                    <div className="loading">Loading tasks...</div>
                  ) : (
                    <TaskList
                      tasks={filterTasksByType("monthly")}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  )}
                </div>
              </div>

              <div
                className={`tab-panel ${
                  activeTab === "weekly" ? "active" : ""
                }`}
              >
                <div className="task-list">
                  <h3>Weekly Production Plans</h3>
                  {loading ? (
                    <div className="loading">Loading tasks...</div>
                  ) : (
                    <TaskList
                      tasks={filterTasksByType("weekly")}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  )}
                </div>
              </div>

              <div
                className={`tab-panel ${activeTab === "daily" ? "active" : ""}`}
              >
                <div className="task-list">
                  <h3>Daily Production Plans & Reports</h3>
                  {loading ? (
                    <div className="loading">Loading tasks...</div>
                  ) : (
                    <TaskList
                      tasks={filterTasksByType("daily")}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
