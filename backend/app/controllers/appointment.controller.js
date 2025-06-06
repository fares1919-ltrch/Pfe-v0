const db = require("../models");
const Appointment = db.appointment;
const Center = db.center;
const User = db.user;
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService");

/**
 * CITIZEN ENDPOINTS
 * Endpoints for citizens to manage their appointments
 */

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { appointmentDate, centerId } = req.body;

    // Restrict user to only one active appointment (pending, validated, or rejected)
    const existing = await Appointment.findOne({
      userId: req.userId,
      status: { $in: ["pending", "validated", "rejected"] },
    });
    if (existing) {
      return res.status(400).send({
        message:
          "You already have an active appointment. Please complete, cancel, or wait for rejection before scheduling a new one.",
      });
    }

    // Validate date
    const newDate = new Date(appointmentDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format for appointmentDate",
      });
    }

    // Check if center exists
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Check if date is in the future
    const now = new Date();
    if (newDate <= now) {
      return res.status(400).send({
        message: "Appointment date must be in the future",
      });
    }

    // Check center availability on that day
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][newDate.getDay()];

    // Check if center is open that day
    if (
      !center.workingHours[dayName] ||
      !center.workingHours[dayName].start ||
      !center.workingHours[dayName].end
    ) {
      return res.status(400).send({
        message: `The center is closed on ${dayName}`,
      });
    }

    // Create appointment
    const appointment = new Appointment({
      userId: req.userId, // Current user is the citizen
      centerId: centerId,
      appointmentDate: appointmentDate,
      status: "pending",
      cpfGenerationStatus: "pending",
    });

    const savedAppointment = await appointment.save();

    // Populate center details including address for response
    const populatedAppointment = await Appointment.findById(
      savedAppointment._id
    )
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      })
      .populate("userId", "firstName lastName username");

    // Format response with populated center
    const response = {
      ...populatedAppointment.toObject(),
      center: populatedAppointment.centerId,
      user: populatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "created",
      req.userId
    );

    // Return the created appointment
    res.status(201).send({
      message: "Appointment submitted successfully",
      appointment: response,
    });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).send({ message: err.message });
  }
};

// Get all appointments for the current user
exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId })
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      })
      .populate("userId", "firstName lastName username")
      .sort({ appointmentDate: -1 });
    const result = appointments.map((a) => {
      const obj = a.toObject();
      return {
        ...obj,
        center: obj.centerId,
        user: obj.userId,
      };
    });
    res.send({
      appointments: result,
      total: result.length,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get single appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("userId", "firstName lastName username")
      .populate("officerId", "username email firstName lastName")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check if user is authorized to view this appointment
    if (appointment.userId._id.toString() !== req.userId && !req.isOfficer) {
      return res
        .status(403)
        .send({ message: "Not authorized to view this appointment" });
    }

    const resultOne = {
      ...appointment.toObject(),
      center: appointment.centerId,
      user: appointment.userId,
    };
    res.send(resultOne);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Reschedule an appointment (citizen can only reschedule rejected appointments)
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate } = req.body;
    const appointmentId = req.params.id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check authorization
    if (appointment.userId.toString() !== req.userId && !req.isOfficer) {
      return res.status(403).send({
        message: "Not authorized to reschedule this appointment",
      });
    }

    // Citizens can only reschedule rejected appointments
    if (!req.isOfficer && appointment.status !== "rejected") {
      return res.status(400).send({
        message: "Only rejected appointments can be rescheduled by citizens",
      });
    }

    // Validate new date
    const newDate = new Date(appointmentDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format for appointmentDate",
      });
    }

    // Check if date is in the future
    const now = new Date();
    if (newDate <= now) {
      return res.status(400).send({
        message: "Appointment date must be in the future",
      });
    }

    // Get center information to check operating hours
    const center = await Center.findById(appointment.centerId);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Check center availability on that day
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][newDate.getDay()];

    // Check if center is open that day
    if (
      !center.workingHours[dayName] ||
      !center.workingHours[dayName].start ||
      !center.workingHours[dayName].end
    ) {
      return res.status(400).send({
        message: `The center is closed on ${dayName}`,
      });
    }

    // Update appointment
    appointment.appointmentDate = newDate;
    appointment.status = "pending"; // Reset status to pending
    appointment.updatedAt = new Date();

    await appointment.save();

    // Get updated appointment with populated data
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Create response object with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "rescheduled",
      req.userId
    );

    res.send({
      message: "Appointment rescheduled successfully",
      appointment: response,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Cancel an appointment (citizen can only cancel pending or validated appointments)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check authorization
    if (appointment.userId.toString() !== req.userId && !req.isOfficer) {
      return res.status(403).send({
        message: "Not authorized to cancel this appointment",
      });
    }

    // Citizens can only cancel pending or validated appointments
    if (
      !req.isOfficer &&
      appointment.status !== "pending" &&
      appointment.status !== "validated"
    ) {
      return res.status(400).send({
        message:
          "Only pending or validated appointments can be cancelled by citizens",
      });
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "cancelled",
        },
      },
      { new: true }
    )
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Format response with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "cancelled",
      req.userId
    );

    res.status(200).send({
      message: "Appointment cancelled successfully",
      appointment: response,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete an appointment (citizen can only delete pending appointments)
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check authorization
    if (appointment.userId._id.toString() !== req.userId && !req.isOfficer) {
      return res.status(403).send({
        message: "Not authorized to delete this appointment",
      });
    }

    // Citizens can only delete pending appointments
    if (!req.isOfficer && appointment.status !== "pending") {
      return res.status(400).send({
        message: "Only pending appointments can be deleted by citizens",
      });
    }

    // Format appointment for response before deletion
    const appointmentResponse = {
      ...appointment.toObject(),
      center: appointment.centerId,
      user: appointment.userId,
    };

    // Delete appointment
    await Appointment.findByIdAndDelete(appointmentId);

    res.send({
      message: "Appointment deleted successfully",
      appointment: appointmentResponse,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get center's daily appointments (officer only)
exports.getCenterDailyAppointments = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { date } = req.query;

    // Get requested date or use today if not provided
    const requestedDate = date ? new Date(date) : new Date();

    // Get center details
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Get appointments for the day
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Looking for appointments with:", {
      centerId: centerId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Find appointments
    const appointments = await Appointment.find({
      centerId: centerId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    console.log("Found appointments:", appointments);
    console.log("Number of appointments found:", appointments.length);

    // Format response
    const formattedAppointments = appointments.map((apt) => ({
      ...apt.toObject(),
      center: apt.centerId,
      user: apt.userId,
    }));

    res.send({
      date: date || new Date().toISOString().split("T")[0],
      center: {
        id: center._id,
        name: center.name,
        address: center.address,
      },
      appointments: formattedAppointments,
    });
  } catch (err) {
    console.error("Error getting daily appointments:", err);
    res.status(500).send({ message: err.message });
  }
};

/**
 * @swagger
 * /api/appointments/upcoming:
 *   get:
 *     summary: Get upcoming appointments (from tomorrow onwards)
 *     tags: [Appointments (Officer)] # Primarily used by Officer Appointments component
 *     responses:
 *       200:
 *         description: Upcoming appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   appointmentId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [scheduled, completed, cancelled, missed]
 *                   service:
 *                     type: string
 *                   time:
 *                     type: string
 *                     format: "hh:mm A"
 *                   date:
 *                     type: string
 *                     format: date
 *                   centerName:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set to tomorrow
    tomorrow.setHours(0, 0, 0, 0); // Reset time to midnight

    // Add center filtering if provided
    const query = {
      appointmentDate: { $gte: tomorrow },
      status: { $in: ["pending", "validated"] },
    };

    if (req.query.centerId) {
      query.centerId = req.query.centerId;
    }

    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      })
      .sort({ appointmentDate: 1 });

    // Format the response
    const formattedAppointments = appointments.map((appointment) => {
      const time = appointment.appointmentDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const name =
        appointment.userId?.firstName + " " + appointment.userId?.lastName;

      return {
        ...appointment.toObject(),
        center: appointment.centerId,
        time: time,
        date: appointment.appointmentDate.toISOString().split("T")[0],
        centerName: appointment.centerId?.name,
        name: name,
        user: appointment.userId,
      };
    });

    res.status(200).json(formattedAppointments);
  } catch (err) {
    console.error("Error fetching upcoming appointments:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @swagger
 * /api/appointments/complete/{appointmentId}:
 *   put:
 *     summary: Mark an appointment as completed
 *     tags: [Appointments (Officer)] # Primarily used by Officer Appointments component
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the appointment to mark as completed
 *     responses:
 *       200:
 *         description: Appointment marked as completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, completed, cancelled, missed]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Appointment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "completed",
          officerId: req.userId,
        },
      },
      { new: true }
    )
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Format response with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "completed",
      req.userId
    );

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment: response,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/appointments/missed/{appointmentId}:
 *   put:
 *     summary: Mark an appointment as missed
 *     tags: [Appointments (Officer)] # Primarily used by Officer Appointments component
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the appointment to mark as missed
 *     responses:
 *       200:
 *         description: Appointment marked as missed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, completed, cancelled, missed]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Appointment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.missAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "missed",
          officerId: req.userId,
        },
      },
      { new: true }
    )
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Format response with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "missed",
      req.userId
    );

    res.status(200).json({
      message: "Appointment marked as missed successfully",
      appointment: response,
    });
  } catch (error) {
    console.error("Error marking appointment as missed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/officer/appointments/today:
 *   get:
 *     summary: Get today's appointments with optional status filtering
 *     tags: [Appointments (Officer)]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, validated, rejected, missed, completed, cancelled]
 *         required: false
 *         description: Filter appointments by status
 *       - in: query
 *         name: centerId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by center ID
 *     responses:
 *       200:
 *         description: Today's appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   officerId:
 *                     type: string
 *                   centerId:
 *                     type: string
 *                   appointmentDate:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                     enum: [pending, validated, rejected, missed, completed, cancelled]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   center:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       address:
 *                         type: object
 *                   user:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       username:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Add center filtering if provided
    const query = {
      appointmentDate: {
        $gte: today,
        $lt: tomorrow,
      },
    };

    if (req.query.centerId) {
      query.centerId = req.query.centerId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName email username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      })
      .sort({ appointmentDate: 1 });

    // Format the response
    const formattedAppointments = appointments.map((appointment) => ({
      ...appointment.toObject(),
      center: appointment.centerId,
      user: appointment.userId,
    }));

    res.status(200).json(formattedAppointments);
  } catch (err) {
    console.error("Error fetching today's appointments:", err);
    res.status(500).send({ message: err.message });
  }
};

/**
 * @swagger
 * /api/officer/appointments:
 *   get:
 *     summary: Get all appointments for officers with filtering and pagination
 *     tags: [Appointments (Officer)]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, validated, rejected, missed, completed, cancelled]
 *         required: false
 *         description: Filter by appointment status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by user ID
 *       - in: query
 *         name: centerId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by center ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter appointments from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter appointments until this date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       officerId:
 *                         type: string
 *                       centerId:
 *                         type: string
 *                       appointmentDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [pending, validated, rejected, missed, completed, cancelled]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       center:
 *                         type: object
 *                       user:
 *                         type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.getAllAppointmentsOfficer = async (req, res) => {
  try {
    // Extract filter parameters
    const { status, userId, centerId, startDate, endDate, page, limit } =
      req.query;

    // Build query object
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (centerId) {
      query.centerId = centerId;
    }

    /* FUTURE IMPLEMENTATION: Filter appointments by centers assigned to the officer
     * This code is commented out as it requires the centerIds field to be used in the User model.
     * When implemented, this feature will:
     * 1. Automatically filter appointments to only show those at centers the officer is assigned to
     * 2. Improve security by preventing officers from seeing appointments at centers they don't work at
     * 3. Create a more organized workflow where officers only see relevant appointments
     *
    // If no specific centerId is provided, automatically filter by officer's assigned centers
    if (!centerId) {
      const officer = await User.findById(req.userId);
      if (officer && officer.centerIds && officer.centerIds.length > 0) {
        // Only show appointments for centers this officer is assigned to
        query.centerId = { $in: officer.centerIds };
      }
    }
    */

    // Date range filter
    if (startDate || endDate) {
      query.appointmentDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    // Execute query with pagination
    const appointments = await Appointment.find(query)
      .populate("userId", "firstName lastName username email")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      })
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const total = await Appointment.countDocuments(query);

    // Map each appointment to include center and user fields
    const result = appointments.map((a) => {
      const obj = a.toObject();
      return {
        ...obj,
        center: obj.centerId,
        user: obj.userId,
      };
    });

    res.send({
      appointments: result,
      total: total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * @swagger
 * /api/appointments/validate/{appointmentId}:
 *   put:
 *     summary: Validate an appointment
 *     tags: [Appointments (Officer)] # Primarily used by Officer Appointments component
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the appointment to validate
 *     responses:
 *       200:
 *         description: Appointment validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, completed, cancelled, missed]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Appointment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.validateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "validated",
          officerId: req.userId,
        },
      },
      { new: true }
    )
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Format response with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "validated",
      req.userId
    );

    res.status(200).json({
      message: "Appointment validated successfully",
      appointment: response,
    });
  } catch (error) {
    console.error("Error validating appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @swagger
 * /api/appointments/reject/{appointmentId}:
 *   put:
 *     summary: Reject an appointment
 *     tags: [Appointments (Officer)] # Primarily used by Officer Appointments component
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the appointment to reject
 *     responses:
 *       200:
 *         description: Appointment rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appointment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [scheduled, completed, cancelled, missed]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Appointment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "rejected",
          officerId: req.userId,
        },
      },
      { new: true }
    )
      .populate("userId", "firstName lastName username")
      .populate({
        path: "centerId",
        select: "name address region workingHours",
      });

    // Format response with populated center
    const response = {
      ...updatedAppointment.toObject(),
      center: updatedAppointment.centerId,
      user: updatedAppointment.userId,
    };

    // Send real-time notification
    await notificationService.notifyAppointmentChange(
      response,
      "rejected",
      req.userId
    );

    res.status(200).json({
      message: "Appointment rejected successfully",
      appointment: response,
    });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
