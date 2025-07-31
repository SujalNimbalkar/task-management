import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ResetPasswordForm from "./ResetPasswordForm";
import "./AuthPage.css";

const AuthPage = () => {
  const [currentForm, setCurrentForm] = useState("login");

  const renderForm = () => {
    switch (currentForm) {
      case "signup":
        return <SignUpForm onSwitchToLogin={() => setCurrentForm("login")} />;
      case "reset":
        return (
          <ResetPasswordForm onSwitchToLogin={() => setCurrentForm("login")} />
        );
      default:
        return (
          <LoginForm
            onSwitchToSignUp={() => setCurrentForm("signup")}
            onSwitchToResetPassword={() => setCurrentForm("reset")}
          />
        );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-overlay">{renderForm()}</div>
      </div>
    </div>
  );
};

export default AuthPage;
