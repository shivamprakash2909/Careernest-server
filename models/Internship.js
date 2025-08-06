const mongoose = require("mongoose");
const internshipSchema = new mongoose.Schema(
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
    // Internship Details
    internship_type: {
      type: String,
      enum: [
        "Summer Internship",
        "Winter Internship",
        "Semester Internship",
        "Project Internship",
        "Research Internship",
      ],
      default: "Summer Internship",
    },
    // Location and Work Arrangement
    location: {
      type: String,
      enum: ["Noida", "Delhi", "Pune", "Mumbai", "Bangalore", "Hyderabad", "Remote", "Work from Home"],
    },
    remote_option: {
      type: Boolean,
      default: false,
    },
    work_from_home: {
      type: Boolean,
      default: false,
    },
    // Duration and Timing
    duration: {
      type: String,
      required: true,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    // Stipend/Compensation
    stipend: {
      type: String,
    },
    stipend_type: {
      type: String,
      enum: ["Fixed", "Performance Based", "Unpaid", "Stipend + Performance Bonus"],
      default: "Fixed",
    },
    stipend_amount_min: {
      type: Number,
    },
    stipend_amount_max: {
      type: Number,
    },
    // Education Requirements
    education_level: {
      type: String,
      enum: ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Any"],
    },
    academic_year: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Any"],
    },
    // Internship Description
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
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    // Perks and Benefits
    perks: [
      {
        type: String,
        trim: true,
      },
    ],
    // Application Details
    application_deadline: {
      type: Date,
    },
    number_of_openings: {
      type: Number,
      default: 1,
    },
    // Company Information
    company_logo: {
      type: String,
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
      enum: ["pending", "approved", "rejected"],
      default: "pending", // Internships require admin approval before being published
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
    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Internship", internshipSchema);
