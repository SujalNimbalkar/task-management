import React, { useState, useEffect } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
} from "../../../services/api";
import "./UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    designation: "",
    roles: [],
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadUsersByRole = async (role) => {
    try {
      setLoading(true);
      const data = await getUsersByRole(role);
      setUsers(data);
    } catch (error) {
      console.error("Error loading users by role:", error);
      alert("Failed to load users by role");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFilter = (role) => {
    setSelectedRole(role);
    if (role) {
      loadUsersByRole(role);
    } else {
      loadUsers();
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        employeeId: "",
        department: "",
        designation: "",
        roles: [],
        isActive: true,
      });
      loadUsers();
      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingUser.id, formData);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        employeeId: "",
        department: "",
        designation: "",
        roles: [],
        isActive: true,
      });
      loadUsers();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await deleteUser(userId);
        loadUsers();
        alert("User deactivated successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to deactivate user");
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      roles: [...user.roles],
      isActive: user.isActive,
    });
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const availableRoles = [
    "admin",
    "plant_head",
    "production_manager",
    "department_operator",
    "quality_controller",
  ];

  const departments = [
    "IT",
    "Production",
    "SMT Line",
    "Quality Control",
    "HR",
    "Finance",
    "Sales",
  ];

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <div className="user-management-actions">
          <select
            value={selectedRole}
            onChange={(e) => handleRoleFilter(e.target.value)}
            className="role-filter"
          >
            <option value="">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="create-user-btn"
          >
            Create New User
          </button>
        </div>
      </div>

      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <h3>{user.name}</h3>
              <span
                className={`status-badge ${
                  user.isActive ? "active" : "inactive"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="user-card-details">
              <p>
                <strong>Employee ID:</strong> {user.employeeId}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Phone:</strong> {user.phone}
              </p>
              <p>
                <strong>Department:</strong> {user.department}
              </p>
              <p>
                <strong>Designation:</strong> {user.designation}
              </p>
              <div className="user-roles">
                <strong>Roles:</strong>
                {user.roles.map((role) => (
                  <span key={role} className="role-badge">
                    {role.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div className="user-card-actions">
              <button onClick={() => handleEditUser(user)} className="edit-btn">
                Edit
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="delete-btn"
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateForm || editingUser) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    employeeId: "",
                    department: "",
                    designation: "",
                    roles: [],
                    isActive: true,
                  });
                }}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Employee ID:</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Department:</label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation:</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Roles:</label>
                <div className="roles-checkboxes">
                  {availableRoles.map((role) => (
                    <label key={role} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      {role.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  Active User
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  {editingUser ? "Update User" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
