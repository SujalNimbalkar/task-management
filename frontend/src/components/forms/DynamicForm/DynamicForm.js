import React, { useState } from "react";
import "./DynamicForm.css";

const DynamicForm = ({ formDefinition, initialData, onSubmit, disabled }) => {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (value) {
      switch (field.type) {
        case "number":
          if (isNaN(value)) {
            return `${field.label} must be a number`;
          }
          break;
        case "date":
          if (isNaN(Date.parse(value))) {
            return `${field.label} must be a valid date`;
          }
          break;
        case "select":
          if (field.options && !field.options.includes(value)) {
            return `${field.label} must be one of: ${field.options.join(", ")}`;
          }
          break;
        default:
          break;
      }
    }
    return null;
  };

  const handleChange = (fieldId, value) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);

    // Validate field
    const field = formDefinition.fields.find((f) => f.id === fieldId);
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [fieldId]: error,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    formDefinition.fields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      name: field.id,
      value: formData[field.id] || "",
      onChange: (e) => handleChange(field.id, e.target.value),
      disabled: disabled,
      className: `form-field ${errors[field.id] ? "error" : ""}`,
    };

    switch (field.type) {
      case "textarea":
        return <textarea {...commonProps} rows={4} />;
      case "select":
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "date":
        return <input {...commonProps} type="date" />;
      case "number":
        return <input {...commonProps} type="number" />;
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      <h3>{formDefinition.name}</h3>
      {formDefinition.fields.map((field) => (
        <div key={field.id} className="form-group">
          <label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {renderField(field)}
          {errors[field.id] && (
            <span className="error-message">{errors[field.id]}</span>
          )}
        </div>
      ))}
      <div className="form-actions">
        <button type="submit" disabled={disabled}>
          Submit
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
