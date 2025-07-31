import React from "react";
import "./UserSelector.css";

const UserSelector = ({ users, selectedUser, onSelect }) => {
  return (
    <div className="user-selector">
      <label htmlFor="user-select">Select User:</label>
      <div className="select-wrapper">
        <select
          id="user-select"
          value={selectedUser}
          onChange={(e) => onSelect(e.target.value)}
          className="user-select"
        >
          <option value="">Choose a user...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.employeeId} ({user.department})
            </option>
          ))}
        </select>
        <div className="select-arrow"></div>
      </div>
      {selectedUser && (
        <div className="selected-user-info">
          {(() => {
            const user = users.find((u) => u.id === parseInt(selectedUser, 10));
            if (!user) return null;

            return (
              <div className="user-details">
                <div className="user-basic-info">
                  <h4>{user.name}</h4>
                  <p>
                    <strong>Employee ID:</strong> {user.employeeId}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Department:</strong> {user.department}
                  </p>
                  <p>
                    <strong>Designation:</strong> {user.designation}
                  </p>
                  <p>
                    <strong>Phone:</strong> {user.phone}
                  </p>
                </div>
                <div className="user-roles">
                  <strong>Roles:</strong>
                  {user.roles.map((role) => (
                    <span key={role} className="role-badge">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="user-status">
                  <span
                    className={`status-badge ${
                      user.isActive ? "active" : "inactive"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
