import React from "react";

export default function UserSelector({ users, selectedUser, onSelect }) {
  return (
    <select value={selectedUser} onChange={(e) => onSelect(e.target.value)}>
      <option value="">Select User</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
