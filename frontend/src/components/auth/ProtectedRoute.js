import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import AuthPage from "./AuthPage";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "1.2rem",
            textAlign: "center",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return children;
};

export default ProtectedRoute;
