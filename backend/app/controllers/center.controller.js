const db = require("../models");
const Center = db.center;
const Appointment = db.appointment;
const createOrUpdateCenterSchedule = require("../utils/centerSchedule");
const moment = require("moment");

const controller = {};

/************************************************
 * CENTER RETRIEVAL
 * Get center information
 ************************************************/
// Get all centers
controller.getAllCenters = async (req, res) => {
  try {
    const centers = await Center.find({ status: "active" });

    // Format response with all centers (no filtering)
    const formattedCenters = centers.map((center) => {
      return {
        id: center._id,
        name: center.name,
        region: center.region,
        address: {
          street: center.address.street,
          city: center.address.city,
          state: center.address.state,
          postalCode: center.address.postalCode,
          lat: center.address.lat,
          lon: center.address.lon,
        },
        capacity: center.capacity.hourly,
        workingHours: {
          start: center.workingHours.monday.start,
          end: center.workingHours.monday.end,
        },
      };
    });

    res.send({
      centers: formattedCenters,
    });
  } catch (err) {
    console.error("Error in getAllCenters:", err);
    res.status(500).send({ message: err.message });
  }
};

// Get center by ID
controller.getCenterById = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }
    res.send(center);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CENTER MANAGEMENT
 * Create and update centers
 ************************************************/
// Create new center (Officer only)
controller.createCenter = async (req, res) => {
  try {
    console.log("Starting center creation process...");

    const { name, address, region, capacity, workingHours, services, contact } =
      req.body;

    // Validate required fields
    if (
      !name ||
      !address ||
      !region ||
      address.lat === undefined ||
      address.lon === undefined
    ) {
      return res.status(400).send({
        message: "Missing required fields: name, address, or region",
      });
    }

    // Create default working hours if not provided
    const defaultWorkingHours = {
      monday: { start: "08:00", end: "16:00" },
      tuesday: { start: "08:00", end: "16:00" },
      wednesday: { start: "08:00", end: "16:00" },
      thursday: { start: "08:00", end: "16:00" },
      friday: { start: "08:00", end: "13:00" },
      saturday: { start: "09:00", end: "12:00" },
      sunday: { start: "", end: "" },
    };

    // Merge provided working hours with defaults for any missing days
    const mergedWorkingHours = {
      ...defaultWorkingHours,
      ...(workingHours || {}),
    };

    // Ensure all required days have both start and end
    for (const day of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]) {
      if (!mergedWorkingHours[day]) {
        mergedWorkingHours[day] = defaultWorkingHours[day];
      } else {
        if (!mergedWorkingHours[day].start) {
          mergedWorkingHours[day].start = defaultWorkingHours[day].start;
        }
        if (!mergedWorkingHours[day].end) {
          mergedWorkingHours[day].end = defaultWorkingHours[day].end;
        }
      }
    }

    // Prepare default capacity if not provided
    const defaultCapacity = {
      daily: 48,
      hourly: 6,
    };

    // Prepare center object
    const center = new Center({
      name,
      address,
      region,
      capacity: capacity || defaultCapacity,
      workingHours: mergedWorkingHours,
      services: services || ["cpf", "biometric", "document"],
      contact: contact || { phone: "", email: "" },
      status: "active",
    });

    const savedCenter = await center.save();
    console.log(`Center created with ID: ${savedCenter._id}`);

    // Generate center schedule
    try {
      await createOrUpdateCenterSchedule(savedCenter._id);
      console.log("Center schedule generated successfully");
    } catch (scheduleErr) {
      console.error("Error generating center schedule:", scheduleErr.message);
      // Continue anyway since the center was created
    }

    res.status(201).send(savedCenter);
  } catch (err) {
    console.error("ERROR in createCenter:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });

    // Special handling for MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).send({
        message: "A center with this name already exists",
      });
    }

    res.status(500).send({ message: err.message });
  }
};

// Update center (Officer only)
controller.updateCenter = async (req, res) => {
  try {
    const center = await Center.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Regenerate schedule if workingHours or capacity was updated
    if (req.body.workingHours || req.body.capacity) {
      try {
        await createOrUpdateCenterSchedule(center._id);
        console.log(
          `Regenerated schedule for center ${center._id} after update`
        );
      } catch (scheduleErr) {
        console.error(
          "Error regenerating center schedule:",
          scheduleErr.message
        );
      }
    }

    res.send(center);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CENTER SCHEDULING AND STATISTICS
 * Get appointment information and center statistics
 ************************************************/
// Get center's daily schedule (Officer only)
controller.getCenterSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const appointments = await Appointment.find({
      centerId: req.params.id,
      appointmentDate: {
        $gte: new Date(queryDate.setHours(0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59)),
      },
    }).populate("userId", "username firstName lastName");

    res.send(appointments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get center statistics (Officer only)
controller.getCenterStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { centerId: req.params.id };

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    const center = await Center.findById(req.params.id);

    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Calculate average processing time (in minutes)
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed"
    );
    const avgProcessingTime =
      completedAppointments.length > 0
        ? completedAppointments.reduce((acc, curr) => {
            const start = new Date(curr.appointmentDate);
            const end = new Date(curr.updatedAt);
            return acc + (end - start) / (1000 * 60);
          }, 0) / completedAppointments.length
        : 0;

    // Calculate CPF generation success rate
    const generatedCpfs = appointments.filter(
      (a) => a.cpfGenerationStatus === "generated"
    ).length;

    const fraudulentCpfs = appointments.filter(
      (a) => a.cpfGenerationStatus === "fraudulent"
    ).length;

    const cpfSuccessRate =
      completedAppointments.length > 0
        ? (generatedCpfs / completedAppointments.length) * 100
        : 0;

    // Format response according to API spec
    res.send({
      centerId: center._id,
      period: {
        start:
          startDate ||
          appointments[0]?.appointmentDate.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
        end:
          endDate ||
          appointments[appointments.length - 1]?.appointmentDate
            .toISOString()
            .split("T")[0] ||
          new Date().toISOString().split("T")[0],
      },
      stats: {
        totalAppointments: appointments.length,
        completed: completedAppointments.length,
        rescheduled: appointments.filter((a) => a.status === "rejected").length,
        noShow: appointments.filter((a) => a.status === "missed").length,
        averageProcessingTime: Math.round(avgProcessingTime),
        cpfGenerationSuccess: cpfSuccessRate.toFixed(1),
        generatedCpfs: generatedCpfs,
        fraudulentCpfs: fraudulentCpfs,
      },
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get center available slots
controller.getAvailableDays = async (req, res) => {
  try {
    console.log("Getting available days for center:", req.params);
    const { centerId } = req.params;
    const currentMonth = moment().format("YYYY-MM");

    // Find the schedule for current month
    const schedule = await db.centerSchedule.findOne({
      centerId,
      month: currentMonth,
    });

    if (!schedule) {
      return res
        .status(404)
        .send({ message: "No schedule found for this center" });
    }

    // Transform the days array - include all days including Sundays
    const availableDays = schedule.days.map((day) => {
      // Check if it's Sunday (first character of date is the day of week)
      const date = new Date(day.date);
      const isSunday = date.getDay() === 0;

      return {
        date: day.date,
        availableSlots: isSunday ? -1 : day.capacity - day.reservedSlots,
      };
    });

    res.status(200).send(availableDays);
  } catch (err) {
    console.error(`Error getting available days: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

// Add support for the frontend's getAvailableDates function
controller.getAvailableDates = async (req, res) => {
  try {
    const { centerId } = req.params;
    console.log(`Getting available dates for center: ${centerId}`);

    // Get the center to check working hours
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).send({
        message: "Center not found",
        availableDates: [],
      });
    }

    // Map day of week to the working hours field
    const dayMapping = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Get the current and next month schedules
    const currentMonth = moment().format("YYYY-MM");
    const nextMonth = moment().add(1, "month").format("YYYY-MM");

    const schedules = await db.centerSchedule.find({
      centerId,
      month: { $in: [currentMonth, nextMonth] },
    });

    if (!schedules || schedules.length === 0) {
      console.log(`No schedules found for center ${centerId}, creating now...`);
      try {
        await createOrUpdateCenterSchedule(centerId);
        // Try to fetch again after creation
        const newSchedules = await db.centerSchedule.find({
          centerId,
          month: { $in: [currentMonth, nextMonth] },
        });

        if (!newSchedules || newSchedules.length === 0) {
          return res.status(404).send({
            message: "No schedule available for this center",
            availableDates: [],
          });
        }

        schedules.push(...newSchedules);
      } catch (createError) {
        console.error(
          `Error creating schedule for center ${centerId}:`,
          createError
        );
        return res.status(500).send({
          message: "Failed to create center schedule",
          availableDates: [],
        });
      }
    }

    // Collect all available dates from the schedules
    const availableDates = [];

    schedules.forEach((schedule) => {
      schedule.days.forEach((day) => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        const dayName = dayMapping[dayOfWeek];

        // Only skip days that don't have working hours defined
        // Instead of automatically excluding weekends, check if they have working hours
        if (
          !center.workingHours[dayName] ||
          !center.workingHours[dayName].start ||
          !center.workingHours[dayName].end
        ) {
          return;
        }

        // Consider a day available if it has any capacity left
        if (day.capacity > day.reservedSlots) {
          availableDates.push(day.date);
        }
      });
    });

    console.log(
      `Found ${availableDates.length} available dates for center ${centerId}`
    );

    res.status(200).send({
      availableDates: availableDates,
      centerId: centerId,
    });
  } catch (err) {
    console.error(`Error in getAvailableDates: ${err.message}`);
    res.status(500).send({
      message: err.message,
      availableDates: [],
    });
  }
};

// Add support for the frontend's getAvailableTimeSlots function
controller.getAvailableTimeSlots = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).send({
        message: "Date parameter is required",
        availableSlots: [],
      });
    }

    console.log(
      `Getting available time slots for center ${centerId} on date ${date}`
    );

    // First get the center to know its working hours
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).send({
        message: "Center not found",
        availableSlots: [],
      });
    }

    // Get the day of week for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Map day of week to the working hours field
    const dayMapping = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName = dayMapping[dayOfWeek];

    // Check if the center is open on this day
    if (
      !center.workingHours[dayName] ||
      !center.workingHours[dayName].start ||
      !center.workingHours[dayName].end
    ) {
      console.log(`Center ${centerId} is closed on ${dayName}`);
      return res.status(200).send({
        availableSlots: [],
        message: `Center is closed on ${dayName}`,
      });
    }

    // Get the working hours for this day
    const startTime = center.workingHours[dayName].start;
    const endTime = center.workingHours[dayName].end;

    // Parse the working hours
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Find any existing appointments for this date and center
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const existingAppointments = await Appointment.find({
      centerId: centerId,
      appointmentDate: {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),
      },
    });

    // Format existing appointment times for quick lookup
    const bookedTimes = new Set();
    existingAppointments.forEach((appointment) => {
      const appointmentTime = new Date(appointment.appointmentDate);
      const hours = appointmentTime.getHours();
      const minutes = appointmentTime.getMinutes();
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      bookedTimes.add(timeString);
    });

    // Generate available time slots at 30-minute intervals
    const availableSlots = [];

    // Start from the opening time
    let currentHour = startHour;
    let currentMinute = startMinute;

    // Format time as 12-hour AM/PM for the frontend
    const formatTimeSlot = (hour, minute) => {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${displayHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    // Loop through all possible time slots during working hours
    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      // Check if this time slot is booked
      const timeString = `${currentHour
        .toString()
        .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

      if (!bookedTimes.has(timeString)) {
        // Add the formatted time slot
        availableSlots.push(formatTimeSlot(currentHour, currentMinute));
      }

      // Move to next 30-minute slot
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    console.log(
      `Found ${availableSlots.length} available time slots for center ${centerId} on ${date}`
    );

    res.status(200).send({
      availableSlots: availableSlots,
      centerId: centerId,
      date: date,
    });
  } catch (err) {
    console.error(`Error in getAvailableTimeSlots: ${err.message}`);
    res.status(500).send({
      message: err.message,
      availableSlots: [],
    });
  }
};

module.exports = controller;
