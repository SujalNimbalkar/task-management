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
              {user.name} ({user.roles.join(", ")})
            </option>
          ))}
        </select>
        <div className="select-arrow"></div>
      </div>
      {selectedUser && (
        <div className="selected-user-info">
          {users
            .find((u) => u.id === parseInt(selectedUser, 10))
            ?.roles.map((role) => (
              <span key={role} className="role-badge">
                {role}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
