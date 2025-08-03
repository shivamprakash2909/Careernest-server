const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const router = express.Router();

// Register route (legacy - keeping for backward compatibility)
router.post("/register", async (req, res, next) => {
  try {
    const {
      name,
      full_name,
      email,
      password,
      role = "student",
      phone,
      location,
      education_level,
      field_of_study,
      graduation_year,
      skills,
      experience,
      bio,
      resume_url,
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password and role are required." });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const user = new User({
      name: name || full_name,
      full_name: full_name || name,
      email,
      password: hashedPassword,
      role,
      phone,
      location,
      education_level,
      field_of_study,
      graduation_year,
      skills,
      experience,
      bio,
      resume_url,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        education_level: user.education_level,
        field_of_study: user.field_of_study,
        graduation_year: user.graduation_year,
        skills: user.skills,
        experience: user.experience,
        bio: user.bio,
        resume_url: user.resume_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login route (legacy - keeping for backward compatibility)
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const query = role ? { email, role } : { email };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        education_level: user.education_level,
        field_of_study: user.field_of_study,
        graduation_year: user.graduation_year,
        skills: user.skills,
        experience: user.experience,
        bio: user.bio,
        resume_url: user.resume_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
