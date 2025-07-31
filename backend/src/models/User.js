const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    roles: [
      {
        type: String,
        required: true,
        enum: ["admin", "production_manager", "plant_head", "user"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    joinDate: {
      type: Date,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted join date
userSchema.virtual("joinDateFormatted").get(function () {
  return this.joinDate ? this.joinDate.toISOString().split("T")[0] : null;
});

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find active users
userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ roles: role, isActive: true });
};

module.exports = mongoose.model("User", userSchema);
