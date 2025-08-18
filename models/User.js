const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    full_name: { type: String, trim: true }, // Alternative name field used in frontend
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false, default: "" },
    role: { type: String, enum: ["student", "recruiter"], required: true },
    phone: { type: String, trim: true },

    // Student fields
    education_level: {
      type: String,
      enum: [
        "High School",
        "Associate Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "PhD",
        "Professional Certification",
        "Other",
      ],
    },
    field_of_study: { type: String, trim: true },
    graduation_year: { type: String, trim: true },
    collegeName: { type: String, trim: true },
    programme: { type: String, trim: true },
    branch: { type: String, trim: true },
    year: { type: String, trim: true },
    skills: [{ type: String, trim: true }], // Array of skills
    experience: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    resume_url: { type: String, trim: true },

    // Recruiter fields
    company_name: { type: String, trim: true },
    company_size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    industry: {
      type: String,
      enum: [
        "Technology",
        "Healthcare",
        "Finance",
        "Education",
        "Manufacturing",
        "Retail",
        "Consulting",
        "Media & Entertainment",
        "Government",
        "Non-Profit",
        "Other",
      ],
    },
    job_title: { type: String, trim: true },
    company_website: { type: String, trim: true },
    company_description: { type: String, trim: true, maxlength: 2000 },
    company_logo: { type: String, trim: true }, // Company logo URL

    // Common fields
    location: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
    },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true }, // URL or base64

    // Additional useful fields
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },

    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);
