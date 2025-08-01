const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecret';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

router.post('/auth/google', async (req, res) => {
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log('Request body:', req.body);
  const { credential, user_type } = req.body;
  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, given_name, family_name } = payload;

    // Create full name from Google data
    const fullName = name || `${given_name || ''} ${family_name || ''}`.trim() || 'User';

    // Check if user exists with a different role
    let user = await User.findOne({ email });
    if (user && user.role !== user_type) {
      return res.status(409).json({ error: `Email already registered as ${user.role}` });
    }
    // If user exists and role matches, log them in
    if (user && user.role === user_type) {
      // Create JWT
      const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({
        token,
        user: {
          name: user.name,
          full_name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
    // If user does not exist, create new user
    if (!user) {
      user = new User({
        name: fullName,
        email,
        password: '', // No password for Google users
        role: user_type,
        phone: '', // Default empty string
        location: 'Noida', // Default location
        education_level: "Bachelor's Degree", // Default education level
        skills: [], // Default empty array
      });
      try {
        await user.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        throw err;
      }
      // Create JWT for new user
      const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({
        token,
        user: {
          name: user.name,
          full_name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
    // No fallback login allowed
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Form-based login for students
router.post('/auth/student/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email, role: 'student' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(401).json({ error: 'Please use Google login for this account' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return user data and token
    res.json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Form-based login for recruiters
router.post('/auth/recruiter/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email, role: 'recruiter' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(401).json({ error: 'Please use Google login for this account' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return user data and token
    res.json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Recruiter login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Form-based registration for students
router.post('/auth/student/register', async (req, res) => {
  const {
    full_name, email, phone, password, location,
    education_level, field_of_study, graduation_year,
    skills, experience, bio
  } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: `Email already registered as ${existingUser.role}` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name: full_name,
      email,
      password: hashedPassword,
      role: 'student',
      phone,
      location,
      education_level,
      field_of_study,
      graduation_year,
      skills,
      experience,
      bio
    });

    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw err;
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Student registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Form-based registration for recruiters
router.post('/auth/recruiter/register', async (req, res) => {
  const {
    full_name, email, phone, password, company_name,
    company_size, industry, location, job_title,
    company_website, company_description
  } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: `Email already registered as ${existingUser.role}` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name: full_name,
      email,
      password: hashedPassword,
      role: 'recruiter',
      phone,
      location,
      // Store company info in bio field for now (can be extended later)
      bio: `Company: ${company_name}, Size: ${company_size}, Industry: ${industry}, Job Title: ${job_title}, Website: ${company_website}, Description: ${company_description}`
    });

    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw err;
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Recruiter registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Update user profile (student or recruiter)
router.patch('/user/profile', authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const updateData = req.body;
    console.log('PATCH /user/profile updateData:', updateData); // Log incoming data
    // Prevent updating email or password directly
    delete updateData.email;
    delete updateData.password;
    // Flatten address if present
    if (updateData.address) {
      for (const key in updateData.address) {
        updateData[`address.${key}`] = updateData.address[key];
      }
      delete updateData.address;
    }
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed', details: err.message });
  }
});

// Update user password
router.patch('/user/password', authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password) {
      // Google user with no password set
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required.' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      return res.json({ message: 'Password set successfully.' });
    }
    // Normal user: require old password
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password are required.' });
    }
    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect.' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Password update failed', details: err.message });
  }
});

// Delete user account
router.delete('/user/account', authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Account deletion failed', details: err.message });
  }
});

// Check if user has password set
router.get('/user/password-status', authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email }).select('password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ hasPassword: !!(user.password && user.password.trim()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check password status' });
  }
});

// Get current user profile
router.get('/user/profile', authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email }).select('-password -__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router; 