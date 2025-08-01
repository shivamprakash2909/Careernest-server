const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  company_name: { type: String, required: true },
  company_size: String,
  industry: String,
  job_title: String,
  company_website: String,
  company_description: String,
  // Add more recruiter-specific fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Recruiter', recruiterSchema); 