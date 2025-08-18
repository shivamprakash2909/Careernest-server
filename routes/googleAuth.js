const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "yoursecret";

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

router.post("/auth/google", async (req, res) => {
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("Request body:", req.body);
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
    const fullName = name || `${given_name || ""} ${family_name || ""}`.trim() || "User";

    // Check if user exists with a different role
    let user = await User.findOne({ email });
    if (user && user.role !== user_type) {
      return res.status(409).json({ error: `Email already registered as ${user.role}` });
    }
    // If user exists and role matches, log them in
    if (user && user.role === user_type) {
      // Create JWT
      const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
      return res.json({
        token,
        user: {
          name: user.name,
          full_name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    // If user does not exist, create new user
    if (!user) {
      user = new User({
        name: fullName,
        email,
        password: "", // No password for Google users
        role: user_type,
        phone: "", // Default empty string
        location: "", // Default location
        education_level: "Other", // Default education level
        skills: [], // Default empty array
      });
      try {
        await user.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: "Email already registered" });
        }
        throw err;
      }
      // Create JWT for new user
      const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
      return res.json({
        token,
        user: {
          name: user.name,
          full_name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
    // No fallback login allowed
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

// Form-based login for students
router.post("/auth/student/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email, role: "student" });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(401).json({ error: "Please use Google login for this account" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // Return user data and token
    res.json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Form-based login for recruiters
router.post("/auth/recruiter/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email, role: "recruiter" });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has a password (Google users might not have one)
    if (!user.password) {
      return res.status(401).json({ error: "Please use Google login for this account" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // Return user data and token
    res.json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Recruiter login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Form-based registration for students
router.post("/auth/student/register", async (req, res) => {
  const {
    full_name,
    email,
    phone,
    password,
    location,
    education_level,
    field_of_study,
    graduation_year,
    skills,
    experience,
    bio,
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
      role: "student",
      phone,
      location,
      education_level,
      field_of_study,
      graduation_year,
      skills,
      experience,
      bio,
    });

    try {
      await user.save();

      // Email sending logic for student registration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to CareerNest - Registration Complete!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">CareerNest</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Registration Successful</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || "there"}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for registering with CareerNest as a student. Your account has been successfully created.
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                You can now log in and start exploring internship and job opportunities.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${
                  process.env.CLIENT_URL
                }/p/studentauth" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Go to Login
                </a>
              </div>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                If you have any questions, feel free to contact our support team.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                This is an automated email from CareerNest. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send registration email to ${email}:`, emailError);
        // Optionally, you might want to log this error but still allow registration to complete
      }
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Email already registered" });
      }
      throw err;
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Student registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Form-based registration for recruiters
router.post("/auth/recruiter/register", async (req, res) => {
  const {
    full_name,
    email,
    phone,
    password,
    company_name,
    company_size,
    industry,
    location,
    job_title,
    company_website,
    company_description,
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
      role: "recruiter",
      phone,
      location,
      // Store company info in bio field for now (can be extended later)
      bio: `Company: ${company_name}, Size: ${company_size}, Industry: ${industry}, Job Title: ${job_title}, Website: ${company_website}, Description: ${company_description}`,
    });

    try {
      await user.save();

      // Email sending logic for recruiter registration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to CareerNest - Registration Complete!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">CareerNest</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Registration Successful</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || "there"}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for registering with CareerNest as a recruiter. Your account has been successfully created.
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                You can now log in and start posting jobs and internships.
              </p>
              // <div style="text-align: center; margin: 30px 0;">
              //   <a href="${
                process.env.CLIENT_URL
              }/p/studentauth" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              //     Go to Login
              //   </a>
              // </div>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                If you have any questions, feel free to contact our support team.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                This is an automated email from CareerNest. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send registration email to ${email}:`, emailError);
        // Optionally, you might want to log this error but still allow registration to complete
      }
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Email already registered" });
      }
      throw err;
    }

    // Create JWT
    const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        name: user.name,
        full_name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Recruiter registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Update user profile (student or recruiter)
router.patch("/user/profile", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const updateData = req.body;
    console.log("PATCH /user/profile updateData:", updateData); // Log incoming data
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
    const updatedUser = await User.findOneAndUpdate({ email }, { $set: updateData }, { new: true });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ user: updatedUser });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Profile update failed", details: err.message });
  }
});

// Update user password
router.patch("/user/password", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.password) {
      // Google user with no password set
      if (!newPassword) {
        return res.status(400).json({ error: "New password is required." });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      return res.json({ message: "Password set successfully." });
    }
    // Normal user: require old password
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new password are required." });
    }
    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Old password is incorrect." });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Password update failed", details: err.message });
  }
});

// Delete user account
router.delete("/user/account", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ error: "Account deletion failed", details: err.message });
  }
});

// Check if user has password set
router.get("/user/password-status", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email }).select("password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ hasPassword: !!(user.password && user.password.trim()) });
  } catch (err) {
    console.error("Password status check error:", err);
    res.status(500).json({ error: "Failed to check password status" });
  }
});

// Public endpoint to check if user is authenticated (for frontend use)
router.get("/user/auth-status", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ authenticated: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.json({ authenticated: false, message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (error) {
    res.json({ authenticated: false, message: "Invalid or expired token" });
  }
});

// Get current user profile
router.get("/user/profile", authenticateJWT, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email }).select("-password -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Forgot password - Request password reset
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // Check email length
    if (email.length > 254) {
      return res.status(400).json({ error: "Email address is too long" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    // Check if user already has a valid reset token (prevent spam)
    if (user.resetPasswordToken && user.resetPasswordExpires && user.resetPasswordExpires > Date.now()) {
      const timeLeft = Math.ceil((user.resetPasswordExpires - Date.now()) / 60000); // minutes
      return res.status(429).json({
        error: `Password reset email already sent. Please wait ${timeLeft} minutes before requesting another.`,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/p/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - CareerNest",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">CareerNest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || "there"}!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              You requested a password reset for your CareerNest account. Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; word-break: break-all; margin-bottom: 20px;">
              ${resetUrl}
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated email from CareerNest. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      message: "Password reset email sent successfully",
      email: email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
});

// Validate reset token and get user info
router.post("/auth/validate-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    res.json({
      valid: true,
      userRole: user.role,
      email: user.email,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Failed to validate token" });
  }
});

// Reset password with token
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: "Password reset successfully",
      userRole: user.role,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;
