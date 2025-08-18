const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");
const { authenticateJWT } = require("../middleware/auth");
const Notification = require("../models/Notification");

// Seed 3 sample internships
router.post("/seed-internships", async (req, res) => {
  try {
    const samples = [
      {
        title: "Frontend Developer Intern",
        company: "Tech Innovators",
        description: "Work on exciting frontend projects using React.",
        location: "Bangalore",
        stipend: "₹10,000/month",
        duration: "3 months",
        requirements: "Basic knowledge of React and JavaScript.",
      },
      {
        title: "Data Analyst Intern",
        company: "DataWiz",
        description: "Assist in data analysis and visualization tasks.",
        location: "Delhi",
        stipend: "₹12,000/month",
        duration: "6 months",
        requirements: "Familiarity with Python and Excel.",
      },
      {
        title: "Marketing Intern",
        company: "BrandBoost",
        description: "Support digital marketing campaigns and content creation.",
        location: "Mumbai",
        stipend: "₹8,000/month",
        duration: "2 months",
        requirements: "Good communication skills and social media knowledge.",
      },
    ];
    await Internship.insertMany(samples);
    res.json({ message: "Sample internships seeded!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed internships." });
  }
});

// Add internship creation endpoint for recruiters
router.post("/internships/create", authenticateJWT, async (req, res) => {
  try {
    // Only allow recruiters to post internships
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can post internships" });
    }

    // Validate required fields
    const { title, company, location, duration, description } = req.body;

    if (!title || !company || !location || !duration || !description) {
      return res.status(400).json({
        error: "Missing required fields: title, company, location, duration, and description are required",
      });
    }

    // Process array fields (only for fields that should remain as arrays)
    const processedData = {
      ...req.body,
    };

    // Always set posted_by to the authenticated recruiter's email
    const internship = new Internship({
      ...processedData,
      posted_by: req.user.email,
    });
    await internship.save();
    res.status(201).json({
      message: "Internship created successfully and pending admin approval",
      internship,
    });
  } catch (err) {
    console.error("Internship creation error:", err);
    res.status(500).json({ error: "Failed to create internship." });
  }
});

// Admin approval endpoint for internships
router.put("/internships/:id/approve", async (req, res) => {
  try {
    const { status, comments } = req.body;
    const adminEmail = req.headers["x-admin-email"] || "admin@careernest.com";

    const updateData = {
      status,
      admin_review: {
        reviewed_by: adminEmail,
        reviewed_at: new Date(),
        comments: comments || "",
      },
    };

    const internship = await Internship.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Notify recruiter about approval/rejection
    try {
      if (internship && internship.posted_by && ["approved", "rejected"].includes(status)) {
        await Notification.create({
          recipient_email: internship.posted_by,
          recipient_role: "recruiter",
          title: status === "approved" ? "Internship Approved" : "Internship Rejected",
          message:
            status === "approved"
              ? `Your internship posting "${internship.title}" has been approved by admin.`
              : `Your internship posting "${internship.title}" has been rejected by admin.${
                  comments ? ` Reason: ${comments}` : ""
                }`,
          type: "internship_approval",
          priority: status === "approved" ? "medium" : "high",
          meta: { internshipId: internship._id.toString(), status },
        });
      }
    } catch (notifyErr) {
      console.error("Failed to create internship approval notification:", notifyErr);
    }

    res.json({
      message: `Internship ${status} successfully`,
      internship,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update internship status." });
  }
});

// PUT update internship status by id
router.put("/internships/:id", authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;

    // Find the internship first to check ownership
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Only allow the recruiter who posted the internship to update it
    if (internship.posted_by !== req.user.email) {
      return res.status(403).json({ error: "You can only update internships you posted" });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    res.json({ message: "Internship status updated", internship: updatedInternship });
  } catch (err) {
    res.status(500).json({ error: "Failed to update internship status." });
  }
});

// GET all internships (optionally filter by status)
router.get("/internships", async (req, res) => {
  try {
    const { status, posted_by } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (posted_by) filter.posted_by = posted_by;

    // Only show approved internships to students (unless admin is requesting)
    const isAdmin = req.headers["x-admin-auth"] === "true";
    if (!isAdmin) {
      filter.status = "approved";
    }

    const internships = await Internship.find(filter).sort({ postedAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch internships." });
  }
});

// DELETE internship by id
router.delete("/internships/:id", authenticateJWT, async (req, res) => {
  try {
    // Find the internship first to check ownership
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Only allow the recruiter who posted the internship to delete it
    if (internship.posted_by !== req.user.email) {
      return res.status(403).json({ error: "You can only delete internships you posted" });
    }

    await Internship.findByIdAndDelete(req.params.id);
    res.json({ message: "Internship deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete internship." });
  }
});

module.exports = router;
