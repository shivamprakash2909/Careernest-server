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

    // Location and Work Arrangement
    location: {
      type: String,
      required: true,
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
      enum: ["1 week", "2 weeks", "3 weeks", "1 month", "2 months", "3 months", "6 months"],
      required: true,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },
    // Stipend/Compensation
    stipend_type: {
      type: String,
      enum: ["Fixed", "Unpaid"],
      default: "Fixed",
    },
    stipend_amount_min: {
      type: Number,
      min: 0,
    },
    stipend_amount_max: {
      type: Number,
      min: 0,
    },
    // Education Requirements
    education_level: {
      type: String,
      required: true,
    },
    // Internship Description
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: String,
      required: true,
      trim: true,
    },
    // Perks and Benefits
    perks: {
      type: String,
      required: true,
      trim: true,
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

// Custom validation for stipend range
internshipSchema.pre("save", function (next) {
  if (this.stipend_amount_min && this.stipend_amount_max) {
    if (this.stipend_amount_min > this.stipend_amount_max) {
      return next(new Error("Minimum stipend cannot be greater than maximum stipend"));
    }
  }
  next();
});

module.exports = mongoose.model("Internship", internshipSchema);
