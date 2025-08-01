const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    // Application type to distinguish between job and internship applications
    application_type: {
      type: String,
      enum: ["job", "internship"],
      required: true,
    },
    // Job reference (for job applications)
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: function () {
        return this.application_type === "job";
      },
    },
    // Internship reference (for internship applications)
    internship_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: function () {
        return this.application_type === "internship";
      },
    },
    applicant_email: {
      type: String,
      required: true,
      trim: true,
    },
    applicant_name: {
      type: String,
      required: true,
      trim: true,
    },
    resume_url: {
      type: String,
      trim: true,
    },
    cover_letter: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    // Internship-specific fields
    university: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    graduation_year: {
      type: Number,
    },
    current_semester: {
      type: String,
      trim: true,
    },
    technical_skills: {
      type: String,
      trim: true,
    },
    github_profile: {
      type: String,
      trim: true,
    },
    linkedin_profile: {
      type: String,
      trim: true,
    },
    portfolio_url: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
    // Additional fields that might be useful
    company_name: String, // Denormalized for easier queries
    company_logo: String, // Denormalized for easier display
    created_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying (allowing multiple applications per email)
applicationSchema.index({ job_id: 1, status: 1 });
applicationSchema.index({ internship_id: 1, status: 1 });
applicationSchema.index({ created_date: -1 }); // For sorting by date

// Virtual to populate job details
applicationSchema.virtual("job", {
  ref: "Job",
  localField: "job_id",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate internship details
applicationSchema.virtual("internship", {
  ref: "Internship",
  localField: "internship_id",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Application", applicationSchema);
