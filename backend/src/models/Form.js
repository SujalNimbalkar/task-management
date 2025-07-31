const mongoose = require("mongoose");

// Schema for form field definitions
const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "text",
        "number",
        "email",
        "date",
        "select",
        "textarea",
        "checkbox",
        "radio",
      ],
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [String], // For select, radio, checkbox fields
    validation: {
      min: Number,
      max: Number,
      pattern: String,
    },
  },
  { _id: false }
);

// Schema for table fields (for dynamic forms)
const tableFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Schema for form definitions
const formDefinitionSchema = new mongoose.Schema(
  {
    formId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["form", "table"],
      default: "form",
    },
    fields: [fieldSchema],
    tableFields: [tableFieldSchema],
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema for form submissions
const formSubmissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    formId: {
      type: String,
      required: true,
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "submitted",
    },
    comments: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Virtual for submission count
formDefinitionSchema.virtual("submissionCount", {
  ref: "FormSubmission",
  localField: "formId",
  foreignField: "formId",
  count: true,
});

// Static method to find active forms
formDefinitionSchema.statics.findActiveForms = function () {
  return this.find({ isActive: true });
};

// Static method to find form by ID
formDefinitionSchema.statics.findByFormId = function (formId) {
  return this.findOne({ formId, isActive: true });
};

// Static method to find submissions by task
formSubmissionSchema.statics.findByTaskId = function (taskId) {
  return this.find({ taskId }).populate("submittedBy", "name email");
};

// Static method to find submissions by form
formSubmissionSchema.statics.findByFormId = function (formId) {
  return this.find({ formId }).populate("submittedBy", "name email");
};

const FormDefinition = mongoose.model("FormDefinition", formDefinitionSchema);
const FormSubmission = mongoose.model("FormSubmission", formSubmissionSchema);

module.exports = {
  FormDefinition,
  FormSubmission,
};
