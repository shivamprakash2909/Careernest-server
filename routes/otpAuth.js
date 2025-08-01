const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User'); // Import your User model

const otpStore = {}; // Use Redis/DB for production

// Nexmo/Vonage credentials should be set in your .env file
const NEXMO_API_KEY = process.env.NEXMO_API_KEY;
const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET;
const NEXMO_FROM = process.env.NEXMO_FROM;

// Utility to format phone numbers
function formatPhone(phone) {
  let p = phone.replace(/[^\d]/g, '');
  if (p.length === 10) p = '91' + p;
  return p;
}

// Send OTP
router.post('/auth/send-otp', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });
  phone = formatPhone(phone);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
  try {
    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: NEXMO_API_KEY,
      api_secret: NEXMO_API_SECRET,
      to: phone,
      from: NEXMO_FROM,
      text: `Your OTP for CareerNest is ${otp}`
    });
    if (response.data && response.data.messages && response.data.messages[0].status === '0') {
      res.json({ success: true, message: 'OTP sent successfully.' });
    } else {
      const errorText = response.data?.messages?.[0]?.['error-text'];
      res.status(500).json({ success: false, message: 'Failed to send OTP via SMS.', error: errorText, nexmo: response.data });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP via SMS.', error: err.message });
  }
});

// Verify OTP and create/fetch student user
router.post('/auth/verify-otp', async (req, res) => {
  let { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
  phone = formatPhone(phone);
  const record = otpStore[phone];
  if (!record || record.otp !== otp) return res.status(401).json({ success: false, message: 'Invalid OTP.' });
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.status(401).json({ success: false, message: 'OTP expired.' });
  }
  delete otpStore[phone];

  // Create or fetch student user
  let user = await User.findOne({ phone, role: 'student' });
  if (!user) {
    user = new User({
      name: 'Student', // You can ask for name later
      phone,
      role: 'student',
      email: `${phone}@careernest.local`, // Placeholder email
      password: '', // No password for OTP users
    });
    await user.save();
  }

  // You should use JWT in production!
  const token = Buffer.from(`${phone}:student`).toString('base64');
  res.json({ success: true, token, user: { id: user._id, phone: user.phone, role: user.role } });
});

module.exports = router; 