const express = require("express");
const Job = require("../models/Job");
const Internship = require("../models/Internship");
const { authenticateJWT } = require("../middleware/auth");
const Notification = require("../models/Notification");
const router = express.Router();

// Get all jobs/internships (only approved ones for students)
router.get("/", async (req, res, next) => {
  try {
    const { job_type, location, status = "active", posted_by } = req.query;
    const filter = { status };

    // Only show approved jobs to students (unless admin is requesting)
    const isAdmin = req.headers["x-admin-auth"] === "true";
    if (!isAdmin) {
      filter.approval_status = "approved";
    }

    if (job_type) filter.job_type = job_type;
    if (location) filter.location = location;
    if (posted_by) filter.posted_by = posted_by;

    const jobs = await Job.find(filter).sort({ postedAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Get all jobs for admin panel (including pending/rejected)
router.get("/admin/all", async (req, res, next) => {
  try {
    const { approval_status, job_type, location } = req.query;
    const filter = {};

    if (approval_status) filter.approval_status = approval_status;
    if (job_type) filter.job_type = job_type;
    if (location) filter.location = location;

    const jobs = await Job.find(filter).sort({ postedAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Legacy routes for backward compatibility - MUST BE BEFORE /:id route
// Get all internships (legacy - using Internship model)
router.get("/internships", async (req, res, next) => {
  try {
    const { posted_by } = req.query;
    const filter = {};

    if (posted_by) filter.posted_by = posted_by;

    const internships = await Internship.find(filter);
    res.json(internships);
  } catch (error) {
    next(error);
  }
});

// Get single internship by ID (legacy)
router.get("/internships/:id", async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }
    res.json(internship);
  } catch (error) {
    next(error);
  }
});

// Update internship (legacy)
router.put("/internships/:id", authenticateJWT, async (req, res, next) => {
  try {
    // Find the internship first to check ownership
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Only allow the recruiter who posted the internship to update it
    if (internship.posted_by !== req.user.email) {
      return res.status(403).json({ error: "You can only update internships you posted" });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Internship updated successfully",
      internship: updatedInternship,
    });
  } catch (error) {
    next(error);
  }
});

// Delete internship (legacy)
router.delete("/internships/:id", authenticateJWT, async (req, res, next) => {
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

    res.json({
      message: "Internship deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Analytics endpoint for recruiter
router.get("/analytics", authenticateJWT, async (req, res, next) => {
  try {
    const recruiterEmail = req.user.email;

    // Get all jobs and internships posted by this recruiter
    const jobs = await Job.find({ posted_by: recruiterEmail });
    const Internship = require("../models/Internship");
    const internships = await Internship.find({ posted_by: recruiterEmail });

    // Get all applications for jobs and internships posted by this recruiter
    const Application = require("../models/Application");
    const jobApplications = await Application.find({
      job_id: { $in: jobs.map((job) => job._id) },
    }).populate("job_id");

    const internshipApplications = await Application.find({
      internship_id: { $in: internships.map((internship) => internship._id) },
    }).populate("internship_id");

    // Combine all applications
    const allApplications = [...jobApplications, ...internshipApplications];

    // Calculate stats
    const totalPostings = jobs.length + internships.length;
    const totalActive =
      jobs.filter((job) => job.status === "active").length +
      internships.filter((internship) => internship.status === "approved").length;
    const totalInactive =
      jobs.filter((job) => job.status === "closed").length +
      internships.filter((internship) => internship.status === "rejected").length;
    const totalHired = allApplications.filter((app) => app.status === "hired").length;

    // Calculate monthly hiring data
    const monthlyHiring = [];
    const currentYear = new Date().getFullYear();

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);

      const hiredInMonth = allApplications.filter((app) => {
        const appDate = new Date(app.created_date);
        return app.status === "hired" && appDate >= monthStart && appDate <= monthEnd;
      }).length;

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      monthlyHiring.push({
        month: monthNames[month],
        hired: hiredInMonth,
      });
    }

    // Calculate monthly jobs posted data
    const monthlyJobs = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);

      const jobsInMonth = jobs.filter((job) => {
        const jobDate = new Date(job.postedAt);
        return jobDate >= monthStart && jobDate <= monthEnd;
      }).length;

      const internshipsInMonth = internships.filter((internship) => {
        const internshipDate = new Date(internship.postedAt);
        return internshipDate >= monthStart && internshipDate <= monthEnd;
      }).length;

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      monthlyJobs.push({
        month: monthNames[month],
        jobs: jobsInMonth + internshipsInMonth,
      });
    }

    res.json({
      stats: {
        totalPostings,
        totalActive,
        totalHired,
        totalInactive,
      },
      monthlyHiring,
      monthlyJobs,
    });
  } catch (error) {
    next(error);
  }
});

// Get single job/internship by ID
router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if user can view this job (approved or admin)
    const isAdmin = req.headers["x-admin-auth"] === "true";
    if (!isAdmin && job.approval_status !== "approved") {
      return res.status(403).json({ error: "Job not available" });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// Create new job/internship
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    // Validate required fields
    const { title, company, location, job_type, description } = req.body;

    if (!title || !company || !location || !job_type || !description) {
      return res.status(400).json({
        error: "Missing required fields: title, company, location, job_type, and description are required",
      });
    }

    // Process array fields
    const processedData = {
      ...req.body,
      responsibilities: Array.isArray(req.body.responsibilities)
        ? req.body.responsibilities
        : req.body.responsibilities
        ? req.body.responsibilities.split(",").map((item) => item.trim())
        : [],
      requirements: Array.isArray(req.body.requirements)
        ? req.body.requirements
        : req.body.requirements
        ? req.body.requirements.split(",").map((item) => item.trim())
        : [],
      skills: Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills
        ? req.body.skills.split(",").map((item) => item.trim())
        : [],
      benefits: Array.isArray(req.body.benefits)
        ? req.body.benefits
        : req.body.benefits
        ? req.body.benefits.split(",").map((item) => item.trim())
        : [],
    };

    const job = new Job(processedData);
    await job.save();
    res.status(201).json({
      message: "Job created successfully and pending admin approval",
      job,
    });
  } catch (error) {
    console.error("Job creation error:", error);
    next(error);
  }
});

// Admin approval endpoint
router.put("/:id/approve", async (req, res, next) => {
  try {
    const { approval_status, comments } = req.body;
    const adminEmail = req.headers["x-admin-email"] || "admin@careernest.com";

    const updateData = {
      approval_status,
      admin_review: {
        reviewed_by: adminEmail,
        reviewed_at: new Date(),
        comments: comments || "",
      },
    };

    const job = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Create a notification for the recruiter who posted this job
    try {
      if (job && job.posted_by && ["approved", "rejected"].includes(approval_status)) {
        await Notification.create({
          recipient_email: job.posted_by,
          recipient_role: "recruiter",
          title: approval_status === "approved" ? "Job Approved" : "Job Rejected",
          message:
            approval_status === "approved"
              ? `Your job posting "${job.title}" has been approved by admin.`
              : `Your job posting "${job.title}" has been rejected by admin.${comments ? ` Reason: ${comments}` : ""}`,
          type: "job_approval",
          priority: approval_status === "approved" ? "medium" : "high",
          meta: { jobId: job._id.toString(), approval_status },
        });
      }
    } catch (notifyErr) {
      console.error("Failed to create job approval notification:", notifyErr);
    }

    res.json({
      message: `Job ${approval_status} successfully`,
      job,
    });
  } catch (error) {
    next(error);
  }
});

// Update job/internship
router.put("/:id", authenticateJWT, async (req, res, next) => {
  try {
    // Find the job first to check ownership
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Only allow the recruiter who posted the job to update it
    if (job.posted_by !== req.user.email) {
      return res.status(403).json({ error: "You can only update jobs you posted" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
});

// Delete job/internship
router.delete("/:id", authenticateJWT, async (req, res, next) => {
  try {
    // Find the job first to check ownership
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Only allow the recruiter who posted the job to delete it
    if (job.posted_by !== req.user.email) {
      return res.status(403).json({ error: "You can only delete jobs you posted" });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
