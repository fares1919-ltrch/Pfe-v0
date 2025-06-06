const cron = require("node-cron");
const moment = require("moment");

/**
 * Schedule job to detect missed appointments
 * This runs every day at 23:30 PM to mark appointments that were not
 * completed or cancelled as "missed"
 */
const scheduleMissedAppointmentDetection = () => {
  console.log("Setting up missed appointment detection cron job");

  // Cron: Run every day at 23:30 PM
  cron.schedule("30 23 * * *", async () => {
    try {
      console.log("Running missed appointment detection job");
      const db = require("../models");
      const Appointment = db.appointment;

      // Get today's date range
      const startOfDay = moment().startOf("day").toDate();
      const endOfDay = moment().endOf("day").toDate();

      // Find all appointments that were scheduled for today but weren't completed or cancelled
      const result = await Appointment.updateMany(
        {
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ["pending", "validated"] },
        },
        {
          $set: {
            status: "missed",
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        `Missed appointment detection completed: ${result.modifiedCount} appointments marked as missed`
      );
    } catch (err) {
      console.error("CRITICAL ERROR during missed appointment detection:", err);
    }
  });
};

module.exports = scheduleMissedAppointmentDetection;
