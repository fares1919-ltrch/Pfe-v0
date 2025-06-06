// cron/generateMonthlySchedules.js
const cron = require("node-cron");
const createOrUpdateCenterSchedule = require("../utils/centerSchedule");

/**
 * Schedule monthly center schedule generation
 * This runs on the 1st day of each month at 00:05 AM
 * to create appointment schedules for all active centers
 */
const scheduleMonthlyUpdate = () => {
  console.log("Setting up monthly center schedule update cron job");

  // Cron: Run on the 1st day of each month at 00:05 AM
  cron.schedule("5 0 1 * *", async () => {
    try {
      console.log("Running monthly center schedule update job");
      const db = require("../models");
      const Center = db.center;

      const centers = await Center.find({ status: "active" });
      let successCount = 0;
      let errorCount = 0;

      console.log(
        `Found ${centers.length} active centers to update schedules for`
      );

      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
          successCount++;
        } catch (error) {
          console.error(
            `Error updating schedule for center ${center.name}:`,
            error.message
          );
          errorCount++;
        }
      }

      console.log(
        `Monthly schedule update completed: ${successCount} centers updated, ${errorCount} errors`
      );
    } catch (err) {
      console.error("CRITICAL ERROR during monthly schedule update:", err);
    }
  });
};

module.exports = scheduleMonthlyUpdate;
