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
    },
    // Salary/Compensation
    salary_min: {
      type: Number,
      required: true,
      min: 0,
    },
    salary_max: {
      type: Number,
      min: 0,
    },
    salary_type: {
      type: String,
      enum: ["Per Annum", "Per Month"],
      default: "Per Annum",
    },
    salary_currency: {
      type: String,
      default: "INR",
    },
    // Job Details
    job_type: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time"],
    },
    experience_level: {
      type: String,
      enum: ["Fresher", "Entry Level", "Mid Level", "Senior Level", "Executive"],
    },
    experience_years_min: {
      type: Number,
      min: 0,
    },
    experience_years_max: {
      type: Number,
      min: 0,
    },
    // Education Requirements
    education_level: {
      type: String,
      required: true,
    },
    // Job Description
    description: {
      type: String,
      required: true,
    },
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
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
    // Work Arrangement
    remote_option: {
      type: Boolean,
      default: false,
    },
    work_from_office: {
      type: Boolean,
      default: false,
    },
    number_of_openings: {
      type: Number,
      default: 1,
    },
    // Company Information
    company_logo: {
      type: String, // Company logo URL
    },
    company_website: {
      type: String,
    },
    company_description: {
      type: String,
    },
    // Posted By
    posted_by: {
      type: String, // Email of recruiter who posted
      required: true,
    },
    // Status and Approval
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
