import React, { useState, useEffect } from "react";
import "./DynamicForm.css";

const PLAN_FIELDS = ["h1_plan", "h2_plan", "ot_plan", "target_qty"];
const REPORT_FIELDS = [
  "h1_actual",
  "h2_actual",
  "ot_actual",
  "actual_production",
  "quality_defects",
  "defect_details",
  "responsible_person",
  "production_percentage",
  "reason",
  "rework",
];
const MONTHLY_PLAN_FIELDS = ["monthly_qty"];
const WEEKLY_PLAN_FIELDS = ["weekly_qty"];

const DynamicForm = ({
  formDefinition,
  initialData,
  onSubmit,
  disabled,
  mode = "plan",
}) => {
  console.log("=== DYNAMIC FORM DEBUG ===");
  console.log("Received mode:", mode);
  console.log("Form definition name:", formDefinition?.name);
  console.log("=== END DYNAMIC FORM DEBUG ===");

  const [formData, setFormData] = useState({});
  const [tableRows, setTableRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render when mode changes
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [mode]);

  // Initialize form data
  useEffect(() => {
    if (formDefinition.type === "table") {
      // For table forms, separate header fields from table data
      const headerData = {};
      if (initialData) {
        formDefinition.fields.forEach((field) => {
          if (field.isHeader && initialData[field.id] !== undefined) {
            headerData[field.id] = initialData[field.id];
          }
        });
        if (initialData.rows && Array.isArray(initialData.rows)) {
          setTableRows(initialData.rows);
        } else {
          setTableRows([createEmptyRow()]);
        }
      } else {
        setTableRows([createEmptyRow()]);
      }
      setFormData(headerData);
    } else {
      setFormData(initialData || {});
    }
  }, [formDefinition, initialData]);

  const createEmptyRow = () => {
    const emptyRow = {};
    formDefinition.tableFields.forEach((field) => {
      emptyRow[field.id] = "";
    });
    return emptyRow;
  };

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

  const handleHeaderChange = (fieldId, value) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);
    const field = formDefinition.fields.find((f) => f.id === fieldId);
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [fieldId]: error }));
  };

  const handleTableRowChange = (rowIndex, fieldId, value) => {
    const newTableRows = [...tableRows];
    newTableRows[rowIndex] = { ...newTableRows[rowIndex], [fieldId]: value };
    setTableRows(newTableRows);
    const field = formDefinition.tableFields.find((f) => f.id === fieldId);
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [`row_${rowIndex}_${fieldId}`]: error }));
  };

  const addTableRow = () => {
    setTableRows([...tableRows, createEmptyRow()]);
  };

  const removeTableRow = (rowIndex) => {
    if (tableRows.length > 1) {
      const newTableRows = tableRows.filter((_, index) => index !== rowIndex);
      setTableRows(newTableRows);
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`row_${rowIndex}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const calculateProductionPercentage = (row) => {
    const targetQty = parseFloat(row.target_qty);
    const actualProduction = parseFloat(row.actual_production);
    if (targetQty && actualProduction && targetQty > 0) {
      return ((actualProduction / targetQty) * 100).toFixed(2);
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    formDefinition.fields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });
    tableRows.forEach((row, rowIndex) => {
      formDefinition.tableFields.forEach((field) => {
        const error = validateField(field, row[field.id]);
        if (error) {
          newErrors[`row_${rowIndex}_${field.id}`] = error;
        }
      });
    });
    if (Object.keys(newErrors).length === 0) {
      let submissionData;
      if (formDefinition.type === "table") {
        submissionData = { ...formData, rows: tableRows };
      } else {
        submissionData = formData;
      }
      onSubmit(submissionData);
    } else {
      setErrors(newErrors);
    }
  };

  // Determine which fields to show/edit
  const getFieldMode = (fieldId) => {
    // Unified production plan entry form logic
    if (
      formDefinition.name === "F-PRODUCTION-PLAN-ENTRY" ||
      formDefinition.name === "Production Plan Entry"
    ) {
      if (mode === "monthly") {
        if (fieldId === "weekly_qty") return "hide";
        if (fieldId === "monthly_qty") return "edit";
        // item_name and customer_name always editable
        return "edit";
      } else if (mode === "weekly") {
        if (fieldId === "weekly_qty") return "edit";
        if (fieldId === "monthly_qty") return "readonly";
        // item_name and customer_name always editable
        return "edit";
      }
    }

    // Daily production entry form logic
    if (formDefinition.name === "F-DAILY-PRODUCTION-ENTRY") {
      if (mode === "plan") {
        // In plan mode, hide actual fields
        if (
          fieldId === "h1_actual" ||
          fieldId === "h2_actual" ||
          fieldId === "ot_actual" ||
          fieldId === "actual_production" ||
          fieldId === "quality_defects" ||
          fieldId === "defect_details" ||
          fieldId === "responsible_person" ||
          fieldId === "production_percentage" ||
          fieldId === "reason" ||
          fieldId === "rework"
        ) {
          return "hide";
        }
        return "edit";
      } else if (mode === "report") {
        // In report mode, plan fields are readonly, actual fields are editable
        if (
          fieldId === "h1_plan" ||
          fieldId === "h2_plan" ||
          fieldId === "ot_plan" ||
          fieldId === "target_qty"
        ) {
          return "readonly";
        }
        return "edit";
      }
    }

    // Default logic for other forms
    if (mode === "plan") {
      if (PLAN_FIELDS.includes(fieldId)) return "edit";
      if (REPORT_FIELDS.includes(fieldId)) return "hide";
      return "edit";
    } else if (mode === "report") {
      if (PLAN_FIELDS.includes(fieldId)) return "readonly";
      if (REPORT_FIELDS.includes(fieldId)) return "edit";
      return "readonly";
    }
    return "edit";
  };

  // Helper to determine header field mode for unified production plan
  const getHeaderFieldMode = (field) => {
    console.log(
      `Header field ${field.id} (${field.label}) - mode: ${mode}, formName: ${formDefinition.name}`
    );

    // For monthly production plans, hide week-related fields
    if (
      (formDefinition.name === "F-PRODUCTION-PLAN-ENTRY" ||
        formDefinition.name === "Production Plan Entry") &&
      mode === "monthly"
    ) {
      if (field.id === "week_number" || field.id === "week_dates") {
        console.log(`✅ Hiding ${field.id} in monthly mode`);
        return "hide";
      }
      console.log(`✅ Showing ${field.id} as editable in monthly mode`);
      return "edit";
    }
    // For weekly production plans, show week fields as editable, others readonly
    if (
      (formDefinition.name === "F-PRODUCTION-PLAN-ENTRY" ||
        formDefinition.name === "Production Plan Entry") &&
      mode === "weekly"
    ) {
      if (field.id === "week_number" || field.id === "week_dates") {
        console.log(`✅ Showing ${field.id} as editable in weekly mode`);
        return "edit";
      }
      console.log(`✅ Showing ${field.id} as readonly in weekly mode`);
      return "readonly";
    }
    // For daily production forms, hide week fields
    if (formDefinition.name === "F-DAILY-PRODUCTION-ENTRY") {
      if (field.id === "week_number" || field.id === "week_dates") {
        console.log(`✅ Hiding ${field.id} in daily mode`);
        return "hide";
      }
    }
    console.log(`✅ Default: showing ${field.id} as editable`);
    return "edit";
  };

  const renderField = (field, value, onChange, errorKey, fieldMode) => {
    if (fieldMode === "hide") return null;
    const commonProps = {
      id: field.id,
      name: field.id,
      value: value || "",
      onChange: (e) => onChange(field.id, e.target.value),
      disabled: disabled || field.readonly || fieldMode === "readonly",
      className: `form-field ${errors[errorKey] ? "error" : ""} ${
        fieldMode === "readonly" ? "readonly" : ""
      }`,
    };
    switch (field.type) {
      case "textarea":
        return <textarea {...commonProps} rows={2} />;
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
        return <input {...commonProps} type="number" step="0.01" />;
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  const renderTableForm = () => (
    <div className="table-form">
      {/* Header Fields */}
      <div className="header-fields">
        {formDefinition.fields.map((field) => {
          const fieldMode = getHeaderFieldMode(field);
          if (fieldMode === "hide") {
            return null;
          }
          return (
            <div key={field.id} className="form-group">
              <label htmlFor={field.id}>{field.label}</label>
              {renderField(
                field,
                formData[field.id],
                handleHeaderChange,
                field.id,
                fieldMode
              )}
              {errors[field.id] && (
                <span className="error-message">{errors[field.id]}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>
            {formDefinition.name === "F-DAILY-PRODUCTION-ENTRY"
              ? "Daily Production Report"
              : "Production Entries"}
          </h3>
          <button
            type="button"
            onClick={addTableRow}
            disabled={disabled || mode === "report"}
            className="add-row-btn"
          >
            + Add Row
          </button>
        </div>
        <div className="table-wrapper">
          <table
            className={`production-table ${
              formDefinition.name === "F-DAILY-PRODUCTION-ENTRY"
                ? "daily-production-table"
                : ""
            }`}
          >
            <thead>
              <tr>
                {formDefinition.tableFields.map((field) => {
                  const fieldMode = getFieldMode(field.id);
                  if (fieldMode === "hide") {
                    return null;
                  }
                  return <th key={field.id}>{field.label}</th>;
                })}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {formDefinition.tableFields.map((field) => {
                    const fieldMode = getFieldMode(field.id);
                    if (fieldMode === "hide") {
                      return null;
                    }
                    if (field.id === "production_percentage") {
                      return (
                        <td key={field.id}>
                          <input
                            type="number"
                            value={calculateProductionPercentage(row)}
                            readOnly
                            className="form-field readonly"
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={field.id}>
                        {renderField(
                          field,
                          row[field.id],
                          (fieldId, value) =>
                            handleTableRowChange(rowIndex, fieldId, value),
                          `row_${rowIndex}_${field.id}`,
                          fieldMode
                        )}
                        {errors[`row_${rowIndex}_${field.id}`] && (
                          <div className="error-message">
                            {errors[`row_${rowIndex}_${field.id}`]}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <button
                      type="button"
                      onClick={() => removeTableRow(rowIndex)}
                      disabled={
                        disabled || tableRows.length === 1 || mode === "report"
                      }
                      className="remove-row-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRegularForm = () => (
    <div className="regular-form">
      {formDefinition.fields.map((field) => (
        <div key={field.id} className="form-group">
          <label htmlFor={field.id}>{field.label}</label>
          {renderField(
            field,
            formData[field.id],
            handleHeaderChange,
            field.id,
            "edit"
          )}
          {errors[field.id] && (
            <span className="error-message">{errors[field.id]}</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="dynamic-form" key={renderKey}>
      {formDefinition.type === "table"
        ? renderTableForm()
        : renderRegularForm()}
      <div className="form-actions">
        <button type="submit" disabled={disabled} className="submit-btn">
          Submit
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
