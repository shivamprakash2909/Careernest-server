const express = require("express");
const Notification = require("../models/Notification");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();

// Get notifications for current user
router.get("/", authenticateJWT, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipient_email: req.user.email };
    if (unreadOnly === "true") {
      filter.read = false;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(200);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Mark single notification as read
router.patch("/:id/read", authenticateJWT, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_email: req.user.email },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    next(error);
  }
});

// Mark all as read for current user
router.patch("/mark-all-read", authenticateJWT, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient_email: req.user.email, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete("/:id", authenticateJWT, async (req, res, next) => {
  try {
    const result = await Notification.findOneAndDelete({ _id: req.params.id, recipient_email: req.user.email });
    if (!result) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
