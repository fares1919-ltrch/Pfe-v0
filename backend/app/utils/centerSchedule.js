const moment = require("moment");
const db = require("../models");
const CenterSchedule = db.centerSchedule;

/**
 * Creates or updates a center's schedule for the current month
 *
 * @param {string} centerId - MongoDB ID of the center to update schedules for
 * @returns {Promise<boolean>} - True if operation was successful
 */
const createOrUpdateCenterSchedule = async (centerId) => {
  try {
    console.log(`Creating/updating schedule for center ID: ${centerId}`);

    // Get current month info
    const today = moment();
    const currentMonth = today.format("YYYY-MM");
    const nextMonth = today.clone().add(1, "months").format("YYYY-MM");

    // Clean up old schedules (keep only current and next two months)
    const previousMonth = moment().subtract(1, "months").format("YYYY-MM");
    const deleteResult = await CenterSchedule.deleteMany({
      centerId,
      month: { $lt: previousMonth },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(
        `Deleted ${deleteResult.deletedCount} old schedules for center ${centerId}`
      );
    }

    // Fetch center details to get working hours
    const center = await db.center.findById(centerId);
    if (!center) {
      throw new Error(`Center with ID ${centerId} not found`);
    }

    // Function to generate days for a given month
    const generateDaysForMonth = (monthMoment) => {
      const startOfMonth = monthMoment.clone().startOf("month");
      const endOfMonth = monthMoment.clone().endOf("month");
      const days = [];

      for (
        let date = startOfMonth.clone();
        date.isSameOrBefore(endOfMonth);
        date.add(1, "day")
      ) {
        const dayName = date.format("dddd").toLowerCase(); // Get day name (monday, tuesday, etc.)
        let capacity = 0;
        let openingTime = "";
        let closingTime = "";

        // Set capacity and hours based on center's working hours
        if (
          center.workingHours[dayName] &&
          center.workingHours[dayName].start &&
          center.workingHours[dayName].end
        ) {
          // Center is open on this day
          openingTime = center.workingHours[dayName].start;
          closingTime = center.workingHours[dayName].end;

          // Calculate capacity based on opening hours and hourly capacity
          const startMoment = moment(openingTime, "HH:mm");
          const endMoment = moment(closingTime, "HH:mm");
          const hoursOpen = endMoment.diff(startMoment, "hours", true);
          capacity = Math.floor(hoursOpen * center.capacity.hourly);
        } else {
          // Center is closed on this day
          openingTime = "00:00";
          closingTime = "00:00";
          capacity = 0;
        }

        days.push({
          date: date.format("YYYY-MM-DD"),
          capacity,
          openingTime,
          closingTime,
          reservedSlots: 0,
          reservedSlotsDetails: [],
        });
      }

      return days;
    };

    // Process both current and next month
    const monthsToProcess = [
      { month: currentMonth, momentObj: today.clone() },
      { month: nextMonth, momentObj: today.clone().add(1, "months") },
    ];

    for (const { month, momentObj } of monthsToProcess) {
      // Generate days for this month
      const days = generateDaysForMonth(momentObj);

      // Find existing schedule for this month and center
      let centerSchedule = await CenterSchedule.findOne({
        centerId,
        month: month,
      });

      if (centerSchedule) {
        console.log(
          `Found existing schedule for center ${centerId}, month ${month} - updating`
        );

        // Update existing document but preserve reservation details
        for (const newDay of days) {
          const existingDay = centerSchedule.days.find(
            (d) => d.date === newDay.date
          );
          if (existingDay) {
            // Preserve existing reservations
            newDay.reservedSlots = existingDay.reservedSlots;
            newDay.reservedSlotsDetails = existingDay.reservedSlotsDetails;
          }
        }
        centerSchedule.days = days;
        await centerSchedule.save();
        console.log(
          `Updated schedule for center ${centerId} for month ${month}`
        );
      } else {
        console.log(
          `No existing schedule found for center ${centerId}, month ${month} - creating new`
        );

        // Create a new schedule
        centerSchedule = new CenterSchedule({
          centerId,
          month: month,
          slotDuration: 30, // 30 minute slots
          days,
        });
        await centerSchedule.save();
        console.log(
          `Created new schedule for center ${centerId} for month ${month}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error(
      `ERROR in createOrUpdateCenterSchedule for center ${centerId}:`,
      error.message
    );
    console.error(`Stack: ${error.stack}`);
    throw error;
  }
};

module.exports = createOrUpdateCenterSchedule;
