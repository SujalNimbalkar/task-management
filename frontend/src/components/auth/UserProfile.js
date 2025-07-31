import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./UserProfile.css";

const UserProfile = () => {
  const { currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-avatar">
          {currentUser.displayName
            ? currentUser.displayName.charAt(0).toUpperCase()
            : currentUser.email.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">{currentUser.displayName || "User"}</div>
          <div className="user-email">{currentUser.email}</div>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="logout-button"
      >
        {loading ? "Signing Out..." : "Sign Out"}
      </button>
    </div>
  );
};

export default UserProfile;
