import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import userMappingService from "../services/userMappingService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [databaseUser, setDatabaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      console.log("Auth state changed:", user);
      setCurrentUser(user);

      if (user) {
        try {
          console.log("User logged in, initializing user mapping...");
          // Initialize user mapping service
          await userMappingService.initialize();

          // Map Firebase user to database user
          const mappedUser = userMappingService.getDatabaseUser(user);
          console.log("Mapped user:", mappedUser);
          setDatabaseUser(mappedUser);
        } catch (error) {
          console.error("Failed to map user:", error);
          setDatabaseUser(null);
        }
      } else {
        console.log("User logged out");
        setDatabaseUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    return await authService.signIn(email, password);
  };

  const signUp = async (email, password, displayName) => {
    return await authService.signUp(email, password, displayName);
  };

  const signOut = async () => {
    return await authService.signOut();
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const value = {
    currentUser,
    databaseUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
