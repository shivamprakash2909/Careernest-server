const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      enum: ["Noida", "Delhi", "Pune", "Mumbai", "Bangalore", "Hyderabad"],
    },
    salary_min: {
      type: Number,
    },
    salary_max: {
      type: Number,
    },
    stipend: {
      type: String, // For internships - can be used instead of salary_min/max
    },
    salary: {
      type: Number,
    },
    job_type: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
    },
    experience_level: {
      type: String,
      enum: ["Entry Level", "Mid Level", "Senior Level", "Executive"],
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    remote_option: {
      type: Boolean,
      default: false,
    },
    posted_by: {
      type: String, // Email of recruiter who posted
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    approval_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // Jobs require admin approval before being published
    },
    admin_review: {
      reviewed_by: {
        type: String, // Admin email who reviewed
      },
      reviewed_at: {
        type: Date,
      },
      comments: {
        type: String, // Admin comments for approval/rejection
      },
    },
    company_logo: {
      type: String, // Company logo URL
    },
    duration: {
      type: String, // For internships
    },
    salary_disclosed: {
      type: Boolean,
      default: true,
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

// Indexes for faster queries
jobSchema.index({ job_type: 1, location: 1, status: 1 });
jobSchema.index({ posted_by: 1 });
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ approval_status: 1 }); // Add index for approval status

module.exports = mongoose.model("Job", jobSchema);
