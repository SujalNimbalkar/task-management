import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./LoginForm.css";

const ResetPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-form-container">
        <div className="login-form-card">
          <h2 className="login-form-title">Check Your Email</h2>
          <p className="login-form-subtitle">
            We've sent a password reset link to {email}
          </p>
          <div className="success-message">
            Please check your email and follow the instructions to reset your
            password.
          </div>
          <button
            type="button"
            className="login-button"
            onClick={onSwitchToLogin}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <h2 className="login-form-title">Reset Password</h2>
        <p className="login-form-subtitle">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="form-footer">
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToLogin}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
