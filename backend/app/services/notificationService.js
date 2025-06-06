const socketService = require("./socketService");
const db = require("../models");
const Notification = db.notification;
const mongoose = require("mongoose");

/**
 * NotificationService handles creating persistent notifications in the database
 * and sending real-time socket notifications to users
 */
class NotificationService {
  /**
   * Create a notification and send a real-time update via socket
   * @param {Object} options - Notification options
   * @param {string} options.userId - User ID to notify
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Type of notification (appointment, request_status, document, system)
   * @param {Object} options.metadata - Additional metadata for the notification
   * @param {string} options.socketEvent - Socket event name to emit (optional)
   * @param {Object} options.socketData - Data to send with socket event (optional)
   * @returns {Object} The created notification
   */
  async sendNotification(options) {
    try {
      const {
        userId,
        title,
        message,
        type,
        metadata = {},
        socketEvent,
        socketData,
      } = options;

      // Prepare metadata - ensure ObjectIds are valid
      const notificationMetadata = {};

      // Only add metadata properties if they exist and are valid
      if (metadata.appointmentId) {
        try {
          notificationMetadata.appointmentId = mongoose.Types.ObjectId.isValid(
            metadata.appointmentId
          )
            ? metadata.appointmentId
            : null;
        } catch (err) {
          console.log(
            `Invalid appointmentId: ${metadata.appointmentId}, not adding to notification`
          );
        }
      }

      if (metadata.requestId) {
        try {
          notificationMetadata.requestId = mongoose.Types.ObjectId.isValid(
            metadata.requestId
          )
            ? metadata.requestId
            : null;
        } catch (err) {
          console.log(
            `Invalid requestId: ${metadata.requestId}, not adding to notification`
          );
        }
      }

      if (metadata.documentId) {
        notificationMetadata.documentId = metadata.documentId;
      }

      // Create database notification
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        metadata: notificationMetadata,
        read: false,
      });

      await notification.save();
      console.log(
        `Database notification created for user ${userId}: ${notification._id}`
      );

      // Send socket notification if socket event is provided
      if (socketEvent) {
        const data = socketData || {
          notification: {
            id: notification._id,
            type,
            title,
            message,
            createdAt: notification.createdAt,
          },
        };

        if (socketService.isUserOnline(userId)) {
          socketService.notifyUser(userId, socketEvent, data);
          console.log(
            `Socket notification sent to user ${userId} for event ${socketEvent}`
          );
        } else {
          console.log(
            `User ${userId} is not online, socket notification not sent`
          );
        }
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Send a notification to all users with a specific role
   * @param {Object} options - Notification options
   * @param {string} options.role - User role to notify
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Type of notification
   * @param {string} options.socketEvent - Socket event name to emit
   * @param {Object} options.socketData - Data to send with socket event
   */
  async notifyRole(options) {
    try {
      const { role, title, message, type, socketEvent, socketData } = options;

      // Only emit socket event to the role
      if (socketEvent) {
        socketService.notifyRole(
          role,
          socketEvent,
          socketData || { title, message, type }
        );
        console.log(
          `Socket notification sent to role ${role} for event ${socketEvent}`
        );
      }
    } catch (error) {
      console.error(`Error notifying role ${options.role}:`, error);
    }
  }

  /**
   * Notify about appointment status changes
   * @param {Object} appointment - The appointment that changed
   * @param {string} action - The action that occurred (created, cancelled, rescheduled, etc.)
   * @param {string} userId - The user ID who initiated the action
   */
  async notifyAppointmentChange(appointment, action, userId) {
    try {
      if (!appointment || !appointment._id) {
        console.error(
          "Invalid appointment object provided to notifyAppointmentChange"
        );
        return;
      }

      const appointmentId = appointment._id.toString();
      const centerId =
        appointment.centerId && appointment.centerId._id
          ? appointment.centerId._id.toString()
          : typeof appointment.centerId === "string"
          ? appointment.centerId
          : null;

      const center = appointment.center || {};
      const centerName = center.name || "CPF Center";

      // Create meaningful notification based on action
      let citizenTitle, citizenMessage, officerTitle, officerMessage;

      switch (action) {
        case "created":
          citizenTitle = "Appointment Created";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been created.`;
          officerTitle = "New Appointment";
          officerMessage = `A new appointment has been scheduled at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()}.`;
          break;
        case "validated":
          citizenTitle = "Appointment Validated";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been validated.`;
          break;
        case "rejected":
          citizenTitle = "Appointment Rejected";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been rejected.`;
          break;
        case "cancelled":
          citizenTitle = "Appointment Cancelled";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been cancelled.`;
          officerTitle = "Appointment Cancelled";
          officerMessage = `An appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been cancelled.`;
          break;
        case "rescheduled":
          citizenTitle = "Appointment Rescheduled";
          citizenMessage = `Your appointment at ${centerName} has been rescheduled to ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()}.`;
          officerTitle = "Appointment Rescheduled";
          officerMessage = `An appointment at ${centerName} has been rescheduled to ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()}.`;
          break;
        case "completed":
          citizenTitle = "Appointment Completed";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been completed.`;
          break;
        case "missed":
          citizenTitle = "Appointment Missed";
          citizenMessage = `You missed your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()}.`;
          break;
        default:
          citizenTitle = "Appointment Update";
          citizenMessage = `Your appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been updated.`;
          officerTitle = "Appointment Update";
          officerMessage = `An appointment at ${centerName} on ${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()} has been updated.`;
      }

      // Always notify the citizen (if they're not the one who initiated the action)
      if (
        appointment.userId &&
        appointment.userId._id &&
        appointment.userId._id.toString() !== userId
      ) {
        const citizenId = appointment.userId._id.toString();

        // Try to create a database notification, but don't let it block socket notifications
        try {
          await this.sendNotification({
            userId: citizenId,
            title: citizenTitle,
            message: citizenMessage,
            type: "appointment",
            metadata: {
              appointmentId: mongoose.Types.ObjectId.isValid(appointmentId)
                ? appointmentId
                : null,
            },
            socketEvent: "appointment_update",
            socketData: {
              type: action,
              appointment: appointment,
            },
          });
          console.log(
            `Appointment ${action} notification sent to citizen ${citizenId}`
          );
        } catch (error) {
          console.error(
            `Failed to create database notification for citizen ${citizenId}:`,
            error
          );

          // Still try to send socket notification even if database notification fails
          if (socketService.isUserOnline(citizenId)) {
            socketService.notifyUser(citizenId, "appointment_update", {
              type: action,
              appointment: appointment,
              title: citizenTitle,
              message: citizenMessage,
            });
            console.log(
              `Socket-only notification sent to citizen ${citizenId}`
            );
          }
        }
      }

      // Notify officers for specific actions
      if (["created", "cancelled", "rescheduled"].includes(action)) {
        // No need to save notifications for all officers in DB, just emit socket event
        await this.notifyRole({
          role: "officer",
          title: officerTitle,
          message: officerMessage,
          type: "appointment",
          socketEvent: "appointment_update",
          socketData: {
            type: action,
            appointment: appointment,
          },
        });
        console.log(`Appointment ${action} notification sent to officers`);

        /* FUTURE IMPLEMENTATION: Notify only officers assigned to this center
         * This code is commented out as it requires the centerIds field to be used in the User model
         * and would replace the notifyRole call above when implemented.
         *
        if (centerId) {
          // Get all officers assigned to this center
          const db = require("../models");
          const User = db.user;
          const assignedOfficers = await User.find({
            roles: { $elemMatch: { $in: await getRoleIdByName("officer") } },
            centerIds: { $elemMatch: { $eq: centerId } }
          });

          // Send notification to each assigned officer
          for (const officer of assignedOfficers) {
            const officerId = officer._id.toString();

            // Send socket notification if officer is online
            if (socketService.isUserOnline(officerId)) {
              socketService.notifyUser(officerId, "appointment_update", {
                type: action,
                appointment: appointment,
                title: officerTitle,
                message: officerMessage,
              });
            }

            // Optionally save notification in database for the officer
            await this.sendNotification({
              userId: officerId,
              title: officerTitle,
              message: officerMessage,
              type: "appointment",
              metadata: {
                appointmentId: mongoose.Types.ObjectId.isValid(appointmentId)
                  ? appointmentId
                  : null,
              },
              socketEvent: "appointment_update",
              socketData: {
                type: action,
                appointment: appointment,
              },
            });
          }

          console.log(`Appointment ${action} notification sent to ${assignedOfficers.length} assigned officers`);
        }
        */
      }
    } catch (error) {
      console.error(
        `Error notifying about appointment change (${action}):`,
        error
      );
    }
  }
}

module.exports = new NotificationService();
