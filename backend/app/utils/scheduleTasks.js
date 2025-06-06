const cron = require("node-cron");
const db = require("../models");
const Center = db.center;
const createOrUpdateCenterSchedule = require("./centerSchedule");

/**
 * Configure all scheduled tasks for the application
 */
const setupScheduledTasks = () => {
  console.log("Setting up scheduled tasks...");

  // Daily task to update center availability (runs at midnight every day)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Starting daily center availability update...");
      const centers = await Center.find({ status: "active" });
      let successCount = 0;
      let errorCount = 0;

      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
          successCount++;
        } catch (centerError) {
          console.error(
            `Error updating availability for center ${center._id}:`,
            centerError.message
          );
          errorCount++;
        }
      }

      console.log(
        `Daily availability update completed: ${successCount} centers updated, ${errorCount} errors`
      );
    } catch (err) {
      console.error("CRITICAL ERROR during daily availability update:", err);
    }
  });

  // Mark missed appointments - check appointments every hour
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Checking for missed appointments...");
      const Appointment = db.appointment;

      // Find validated appointments that are in the past and haven't been marked as missed
      const now = new Date();
      const missedAppointments = await Appointment.find({
        status: "validated",
        appointmentDate: { $lt: now },
      });

      if (missedAppointments.length > 0) {
        console.log(
          `Found ${missedAppointments.length} missed appointments to update`
        );

        for (const appointment of missedAppointments) {
          await Appointment.findByIdAndUpdate(appointment._id, {
            $set: { status: "missed" },
          });
        }

        console.log(
          `Updated ${missedAppointments.length} appointments to missed status`
        );
      } else {
        console.log("No missed appointments found");
      }
    } catch (err) {
      console.error("Error checking for missed appointments:", err);
    }
  });

  // Run initial synchronization at startup to ensure everything is up to date
  setTimeout(async () => {
    try {
      console.log("Running initial center schedule synchronization...");
      const centers = await Center.find({ status: "active" });
      let successCount = 0;
      let errorCount = 0;

      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
          successCount++;
        } catch (error) {
          console.error(`Error for center ${center.name}:`, error.message);
          errorCount++;
        }
      }

      console.log(
        `Initial synchronization completed: ${successCount} centers synchronized, ${errorCount} errors`
      );
    } catch (err) {
      console.error("Error during initial synchronization:", err);
    }
  }, 5000);
};

module.exports = setupScheduledTasks;
