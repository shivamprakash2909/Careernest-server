const express = require("express");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Internship = require("../models/Internship");
const { authenticateJWT } = require("../middleware/auth");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all applications (for recruiters - only their posted jobs/internships)
router.get("/", async (req, res, next) => {
  try {
    // Check if this is an admin request
    const isAdminRequest = req.headers["x-admin-auth"] === "true";

    // If admin request, bypass authentication
    if (!isAdminRequest) {
      // Use the original authenticateJWT middleware
      return authenticateJWT(req, res, next);
    }

    // For admin requests, create a mock user object
    req.user = { role: "admin", email: "admin@careernest.com" };

    const { status, applicant_email, job_id, internship_id, application_type } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (applicant_email) filter.applicant_email = applicant_email;
    if (job_id) filter.job_id = job_id;
    if (internship_id) filter.internship_id = internship_id;
    if (application_type) filter.application_type = application_type;

    // For admin, show all applications
    const applications = await Application.find(filter)
      .populate({
        path: "job_id",
        select: "title position company location salary status type posted_by company_logo",
      })
      .populate({
        path: "internship_id",
        select: "title position company location stipend duration status posted_by company_logo",
      })
      .sort({ created_date: -1 });

    // Transform the response to include all necessary information
    const transformedApplications = applications.map((app) => {
      const source = app.application_type === "job" ? app.job_id : app.internship_id;
      return {
        _id: app._id,
        application_type: app.application_type,
        status: app.status,
        created_date: app.created_date,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter,
        phone: app.phone,
        experience: app.experience,
        university: app.university,
        course: app.course,
        graduation_year: app.graduation_year,
        current_semester: app.current_semester,
        technical_skills: app.technical_skills,
        github_profile: app.github_profile,
        linkedin_profile: app.linkedin_profile,
        portfolio_url: app.portfolio_url,
        company_name: app.company_name || source?.company,
        company_logo: app.company_logo || source?.company_logo,
        position: source?.position,
        location: source?.location,
        title: source?.title,
        // Include other relevant fields from job/internship
        ...(app.application_type === "job"
          ? {
              salary: source?.salary,
              job_id: source?._id,
            }
          : {
              stipend: source?.stipend,
              duration: source?.duration,
              internship_id: source?._id,
            }),
      };
    });

    res.json(transformedApplications);
  } catch (error) {
    next(error);
  }
});

// Check if an application exists
router.get("/check", authenticateJWT, async (req, res, next) => {
  try {
    const { applicant_email, job_id, internship_id, application_type } = req.query;

    let filter = { applicant_email, application_type };
    if (application_type === "job") {
      filter.job_id = job_id;
    } else {
      filter.internship_id = internship_id;
    }

    const existingApplication = await Application.findOne(filter);
    res.json({ hasApplied: !!existingApplication });
  } catch (error) {
    next(error);
  }
});

// Get single application by ID
router.get("/:id", authenticateJWT, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate("job_id").populate("internship_id");

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

// Create new application (for both jobs and internships)
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    const { job_id, internship_id, application_type, applicant_email } = req.body;

    // Validate application type and corresponding ID
    if (application_type === "job") {
      if (!job_id) {
        return res.status(400).json({ error: "job_id is required for job applications" });
      }

      // Verify job exists
      const job = await Job.findById(job_id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if the user has already applied for this job
      const existingApplication = await Application.findOne({
        applicant_email,
        job_id,
        application_type: "job",
      });

      if (existingApplication) {
        return res.status(409).json({ error: "You have already applied for this job" });
      }

      // Add job details to application
      const applicationData = {
        ...req.body,
        company_name: job.company,
        company_logo: job.company_logo,
      };

      const application = new Application(applicationData);
      await application.save();

      res.status(201).json({
        message: "Job application submitted successfully",
        application,
      });
    } else if (application_type === "internship") {
      if (!internship_id) {
        return res.status(400).json({ error: "internship_id is required for internship applications" });
      }

      // Verify internship exists
      const internship = await Internship.findById(internship_id);
      if (!internship) {
        return res.status(404).json({ error: "Internship not found" });
      }

      // Check if the user has already applied for this internship
      const existingApplication = await Application.findOne({
        applicant_email,
        internship_id,
        application_type: "internship",
      });

      if (existingApplication) {
        return res.status(409).json({ error: "You have already applied for this internship" });
      }

      // Add internship details to application
      const applicationData = {
        ...req.body,
        company_name: internship.company,
        company_logo: internship.company_logo,
      };

      const application = new Application(applicationData);
      await application.save();

      res.status(201).json({
        message: "Internship application submitted successfully",
        application,
      });
    } else {
      return res.status(400).json({ error: "Invalid application_type. Must be 'job' or 'internship'" });
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Application creation error:", error);
    next(error);
  }
});

// Update application status
router.patch("/:id/status", async (req, res, next) => {
  try {
    // Check if this is an admin request
    const isAdminRequest = req.headers["x-admin-auth"] === "true";

    // If admin request, bypass authentication
    if (!isAdminRequest) {
      // Use the original authenticateJWT middleware
      return authenticateJWT(req, res, next);
    }

    // For admin requests, create a mock user object
    req.user = { role: "admin", email: "admin@careernest.com" };

    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // If hired, notify the student (applicant)
    try {
      if (application && status === "hired") {
        let titleText = "Your application was successful";
        let messageText = "Congratulations! You have been hired.";
        let meta = { applicationId: application._id.toString(), application_type: application.application_type };

        if (application.application_type === "job" && application.job_id) {
          const job = await Job.findById(application.job_id).select("title company");
          if (job) {
            titleText = `Hired for ${job.title}`;
            messageText = `Congratulations! You have been hired for the position of "${job.title}" at ${job.company}.`;
            meta.jobId = job._id.toString();
          }
        } else if (application.application_type === "internship" && application.internship_id) {
          const internship = await Internship.findById(application.internship_id).select("title company");
          if (internship) {
            titleText = `Selected for ${internship.title}`;
            messageText = `Great news! You have been selected for the internship "${internship.title}" at ${internship.company}.`;
            meta.internshipId = internship._id.toString();
          }
        }

        await Notification.create({
          recipient_email: application.applicant_email,
          recipient_role: "student",
          title: titleText,
          message: messageText,
          type: "application_hired",
          priority: "high",
          meta,
        });
      }
    } catch (notifyErr) {
      console.error("Failed to create hire notification:", notifyErr);
    }

    res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    next(error);
  }
});

// Delete application
router.delete("/:id", authenticateJWT, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Only allow admin, the applicant, or the job/internship poster to delete
    if (req.user.role !== "admin" && application.applicant_email !== req.user.email && req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Not authorized to delete this application" });
    }

    await application.delete();

    res.json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Get applications by job ID
router.get("/job/:jobId", authenticateJWT, async (req, res, next) => {
  try {
    // Verify the job exists and user has permission to view applications
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Only allow job poster or admin to view all applications
    if (req.user.role !== "admin" && job.posted_by !== req.user.email) {
      return res.status(403).json({ error: "Not authorized to view these applications" });
    }

    const applications = await Application.find({
      job_id: req.params.jobId,
      application_type: "job",
    })
      .populate("job_id")
      .sort({ created_date: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get applications by internship ID
router.get("/internship/:internshipId", authenticateJWT, async (req, res, next) => {
  try {
    // Verify the internship exists and user has permission to view applications
    const internship = await Internship.findById(req.params.internshipId);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Only allow internship poster or admin to view all applications
    if (req.user.role !== "admin" && internship.posted_by !== req.user.email) {
      return res.status(403).json({ error: "Not authorized to view these applications" });
    }

    const applications = await Application.find({
      internship_id: req.params.internshipId,
      application_type: "internship",
    })
      .populate("internship_id")
      .sort({ created_date: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get applications by internship ID
router.get("/internship/:internshipId", async (req, res, next) => {
  try {
    const applications = await Application.find({
      internship_id: req.params.internshipId,
      application_type: "internship",
    })
      .populate("internship_id")
      .sort({ created_date: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get applications by applicant email
router.get("/applicant/:email", async (req, res, next) => {
  try {
    const applications = await Application.find({
      applicant_email: req.params.email,
    })
      .populate("job_id")
      .populate("internship_id")
      .sort({ created_date: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get applications for recruiter's posted jobs and internships
router.get("/recruiter/applications", authenticateJWT, async (req, res, next) => {
  try {
    // Check if user is a recruiter
    if (req.user.role !== "recruiter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only recruiters can access this endpoint" });
    }

    const recruiterEmail = req.user.email;
    const { status, application_type } = req.query;

    let filter = {};

    // Filter by status if provided
    if (status) filter.status = status;

    // Filter by application type if provided
    if (application_type) filter.application_type = application_type;

    // Get all jobs posted by this recruiter
    const recruiterJobs = await Job.find({ posted_by: recruiterEmail }).select("_id");
    const recruiterJobIds = recruiterJobs.map((job) => job._id);

    // Get all internships posted by this recruiter
    const recruiterInternships = await Internship.find({ posted_by: recruiterEmail }).select("_id");
    const recruiterInternshipIds = recruiterInternships.map((internship) => internship._id);

    // Find applications for recruiter's jobs and internships
    const jobApplications = await Application.find({
      ...filter,
      job_id: { $in: recruiterJobIds },
      application_type: "job",
    }).populate({
      path: "job_id",
      select: "title position company location salary status type posted_by company_logo",
    });

    const internshipApplications = await Application.find({
      ...filter,
      internship_id: { $in: recruiterInternshipIds },
      application_type: "internship",
    }).populate({
      path: "internship_id",
      select: "title position company location stipend duration status posted_by company_logo",
    });

    // Combine and transform the applications
    const allApplications = [...jobApplications, ...internshipApplications];

    const transformedApplications = allApplications.map((app) => {
      const source = app.application_type === "job" ? app.job_id : app.internship_id;
      return {
        _id: app._id,
        application_type: app.application_type,
        status: app.status,
        created_date: app.created_date,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        resume_url: app.resume_url,
        cover_letter: app.cover_letter,
        phone: app.phone,
        experience: app.experience,
        university: app.university,
        course: app.course,
        graduation_year: app.graduation_year,
        current_semester: app.current_semester,
        technical_skills: app.technical_skills,
        github_profile: app.github_profile,
        linkedin_profile: app.linkedin_profile,
        portfolio_url: app.portfolio_url,
        company_name: app.company_name || source?.company,
        company_logo: app.company_logo || source?.company_logo,
        position: source?.position,
        location: source?.location,
        title: source?.title,
        // Include other relevant fields from job/internship
        ...(app.application_type === "job"
          ? {
              salary: source?.salary,
              job_id: source?._id,
            }
          : {
              stipend: source?.stipend,
              duration: source?.duration,
              internship_id: source?._id,
            }),
      };
    });

    // Sort by creation date (newest first)
    transformedApplications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    res.json(transformedApplications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
