const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';

// Recruiter Registration - This route is now handled by googleAuth.js
// router.post('/auth/recruiter/register', async (req, res) => {
//   const {
//     name, email, password, phone, company_name,
//     company_size, industry, job_title, company_website, company_description
//   } = req.body;

//   if (!name || !email || !password || !company_name) {
//     return res.status(400).json({ error: 'Name, email, password, and company name are required.' });
//   }

//   try {
//     const existingRecruiter = await Recruiter.findOne({ email });
//     if (existingRecruiter) {
//       return res.status(409).json({ error: 'Email already registered.' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const recruiter = new Recruiter({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       company_name,
//       company_size,
//       industry,
//       job_title,
//       company_website,
//       company_description
//     });
//     await recruiter.save();
//     const token = jwt.sign({ email, role: 'recruiter' }, JWT_SECRET, { expiresIn: '1d' });
//     res.status(201).json({
//       message: 'Recruiter registered successfully',
//       token,
//       recruiter: {
//         name: recruiter.name,
//         email: recruiter.email,
//         company_name: recruiter.company_name,
//         role: 'recruiter'
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Error registering recruiter.' });
//   }
// });

// Recruiter Login - This route is now handled by googleAuth.js
// router.post('/auth/recruiter/login', async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required.' });
//   }
//   try {
//     const recruiter = await Recruiter.findOne({ email });
//     if (!recruiter) {
//       return res.status(401).json({ error: 'Invalid email or password.' });
//     }
//     const isMatch = await bcrypt.compare(password, recruiter.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Invalid email or password.' });
//     }
//     const token = jwt.sign({ email, role: 'recruiter' }, JWT_SECRET, { expiresIn: '1d' });
//     res.json({
//       message: 'Login successful',
//       token,
//       recruiter: {
//         name: recruiter.name,
//         email: recruiter.email,
//         company_name: recruiter.company_name,
//         role: 'recruiter'
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Login failed.' });
//   }
// });

module.exports = router; 