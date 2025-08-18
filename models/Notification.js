const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient_email: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    recipient_role: {
      type: String,
      enum: ["student", "recruiter", "admin", "user"],
      default: "user",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["job_approval", "internship_approval", "application_hired", "application_status", "general"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      // Flexible object to store related ids or extra context
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

notificationSchema.index({ recipient_email: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
