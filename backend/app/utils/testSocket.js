/**
 * Socket Test Utility
 *
 * This is a testing utility for verifying that socket notifications work.
 * It can be run from the server to send test notifications.
 *
 * Usage:
 * const testSocket = require('./utils/testSocket');
 * testSocket.sendTestNotification('userId', 'officer'); // Sends test notification
 */

const notificationService = require("../services/notificationService");
const socketService = require("../services/socketService");
const mongoose = require("mongoose");

/**
 * Send a test notification to a specific user
 * @param {string} userId - User ID to notify
 * @param {string} userRole - User role (citizen, officer)
 */
exports.sendTestNotification = async (userId, userRole) => {
  try {
    console.log(`Sending test notification to user ${userId} (${userRole})`);

    await notificationService.sendNotification({
      userId,
      title: "Test Notification",
      message: "This is a test notification from the server.",
      type: "system",
      socketEvent: "test_notification",
      socketData: {
        testId: Date.now(),
        timestamp: new Date().toISOString(),
        message: "Test socket notification",
      },
    });

    return { success: true, message: "Test notification sent" };
  } catch (error) {
    console.error("Error sending test notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Test role notification
 * @param {string} role - Role to notify (citizen, officer)
 */
exports.testRoleNotification = async (role) => {
  try {
    console.log(`Sending test notification to all users with role: ${role}`);

    await notificationService.notifyRole({
      role,
      title: "Role Test",
      message: `This is a test notification for all ${role}s.`,
      type: "system",
      socketEvent: "role_notification",
      socketData: {
        testId: Date.now(),
        role,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true, message: `Test notification sent to all ${role}s` };
  } catch (error) {
    console.error(`Error sending test notification to role ${role}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Test appointment notification
 * @param {string} userId - User ID to notify
 * @param {string} action - Action type (created, validated, etc.)
 */
exports.testAppointmentNotification = async (userId) => {
  try {
    console.log(`Sending test appointment notification to user ${userId}`);

    // Create a mock appointment object
    const mockAppointment = {
      _id: mongoose.Types.ObjectId(), // Generate a valid ObjectId
      userId: { _id: userId },
      centerId: { _id: mongoose.Types.ObjectId(), name: "Test Center" },
      appointmentDate: new Date(),
      status: "pending",
      cpfGenerationStatus: "pending",
      center: {
        name: "Test Center",
        address: {
          street: "Test Street",
          city: "Test City",
        },
      },
    };

    // Send socket notification only, bypass database notification
    const socketData = {
      type: "created",
      appointment: mockAppointment,
    };

    // Don't use notifyAppointmentChange as it tries to create a database record
    // Instead, just send a socket event
    if (socketService.isUserOnline(userId)) {
      socketService.notifyUser(userId, "appointment_update", socketData);
      console.log(
        `Test socket notification sent to user ${userId} for appointment`
      );
    } else {
      console.log(`User ${userId} is not online, socket notification not sent`);
    }

    return { success: true, message: "Test appointment notification sent" };
  } catch (error) {
    console.error("Error sending test appointment notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of currently online users
 */
exports.getOnlineUsers = () => {
  return {
    onlineUsers: socketService.getOnlineUsers(),
    onlineCount: socketService.getOnlineUsers().length,
  };
};

module.exports = exports;
