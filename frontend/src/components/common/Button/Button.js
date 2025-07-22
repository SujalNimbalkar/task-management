import React from "react";
import "./Button.css";

const Button = ({ onClick, disabled, children, variant = "primary" }) => {
  return (
    <button
      className={`button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
