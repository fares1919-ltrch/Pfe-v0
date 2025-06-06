const db = require("../models");
const User = db.user;
const Notification = db.notification;
const notificationService = require("../services/notificationService");

/************************************************
 * NOTIFICATION CREATION
 * Send notifications to users
 ************************************************/
// Send notification to user
exports.sendNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      metadata = {},
      socketEvent,
      socketData,
    } = req.body;

    // Use the notification service to handle both DB storage and socket
    const notification = await notificationService.sendNotification({
      userId,
      title,
      message,
      type,
      metadata,
      socketEvent,
      socketData,
    });

    res.status(201).send({
      message: "Notification sent successfully",
      notification,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * NOTIFICATION RETRIEVAL
 * Get notifications with filtering
 ************************************************/
// Get user's notifications with pagination
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { userId: req.userId };
    if (req.query.read !== undefined) {
      query.read = req.query.read === "true";
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      notifications,
      currentPage: page,
      totalPages,
      totalNotifications: total,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });

    res.json({ count });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * NOTIFICATION MANAGEMENT
 * Update notification status (read/unread)
 ************************************************/
// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).send({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.send({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { $set: { read: true } }
    );

    res.send({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).send({ message: "Notification not found" });
    }

    await notification.deleteOne();
    res.send({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
