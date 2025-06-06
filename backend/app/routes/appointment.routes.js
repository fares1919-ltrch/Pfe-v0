const { authJwt } = require("../middlewares");
const controller = require("../controllers/appointment.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - userId
 *         - centerId
 *         - appointmentDate
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user who has the appointment
 *         officerId:
 *           type: string
 *           description: The ID of the officer assigned to the appointment (optional)
 *         centerId:
 *           type: string
 *           description: The ID of the center where the appointment will take place
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: The date and time of the appointment
 *         status:
 *           type: string
 *           enum: [pending, validated, rejected, completed, missed, cancelled]
 *           default: pending
 *           description: Current status of the appointment
 *         cpfGenerationStatus:
 *           type: string
 *           enum: [pending, generated, fraudulent]
 *           default: pending
 *           description: Status of CPF generation process
 *         cost:
 *           type: string
 *           description: "Cost of the appointment (default: 7.09 BRL)"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // ==========================================
  // CITIZEN ENDPOINTS
  // ==========================================

  /**
   * @swagger
   * /api/appointments:
   *   post:
   *     summary: Create a new appointment (citizen)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - appointmentDate
   *               - centerId
   *             properties:
   *               appointmentDate:
   *                 type: string
   *                 format: date-time
   *               centerId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Appointment created successfully
   */
  app.post(
    "/api/appointments",
    [authJwt.verifyToken],
    controller.createAppointment
  );

  /**
   * @swagger
   * /api/appointments:
   *   get:
   *     summary: Get all appointments for the current user (citizen)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's appointments
   */
  app.get(
    "/api/appointments",
    [authJwt.verifyToken],
    controller.getUserAppointments
  );

  /**
   * @swagger
   * /api/appointments/{id}:
   *   get:
   *     summary: Get appointment by ID (citizen or officer)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment details
   */
  app.get(
    "/api/appointments/:id",
    [authJwt.verifyToken],
    controller.getAppointmentById
  );

  /**
   * @swagger
   * /api/appointments/{id}/reschedule:
   *   put:
   *     summary: Reschedule a rejected appointment (citizen)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - appointmentDate
   *             properties:
   *               appointmentDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Appointment rescheduled successfully
   */
  app.put(
    "/api/appointments/:id/reschedule",
    [authJwt.verifyToken],
    controller.rescheduleAppointment
  );

  /**
   * @swagger
   * /api/appointments/{id}/cancel:
   *   put:
   *     summary: Cancel an appointment (citizen)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment cancelled successfully
   */
  app.put(
    "/api/appointments/:id/cancel",
    [authJwt.verifyToken],
    controller.cancelAppointment
  );

  /**
   * @swagger
   * /api/appointments/{id}:
   *   delete:
   *     summary: Delete a pending appointment (citizen)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment deleted successfully
   */
  app.delete(
    "/api/appointments/:id",
    [authJwt.verifyToken],
    controller.deleteAppointment
  );

  // ==========================================
  // OFFICER ENDPOINTS
  // ==========================================

  /**
   * @swagger
   * /api/officer/appointments/{id}/validate:
   *   put:
   *     summary: Validate an appointment (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment validated successfully
   */
  app.put(
    "/api/officer/appointments/:id/validate",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.validateAppointment
  );

  /**
   * @swagger
   * /api/officer/appointments/{id}/reject:
   *   put:
   *     summary: Reject an appointment (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment rejected successfully
   */
  app.put(
    "/api/officer/appointments/:id/reject",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.rejectAppointment
  );

  /**
   * @swagger
   * /api/officer/appointments/{id}/complete:
   *   put:
   *     summary: Mark an appointment as completed (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment completed successfully
   */
  app.put(
    "/api/officer/appointments/:id/complete",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.completeAppointment
  );

  /**
   * @swagger
   * /api/officer/appointments/{id}/miss:
   *   put:
   *     summary: Mark an appointment as missed (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment marked as missed
   */
  app.put(
    "/api/officer/appointments/:id/miss",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.missAppointment
  );

  /**
   * @swagger
   * /api/officer/appointments/today:
   *   get:
   *     summary: Get today's appointments (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: centerId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, validated, rejected, completed, missed, cancelled]
   *     responses:
   *       200:
   *         description: List of today's appointments
   */
  app.get(
    "/api/officer/appointments/today",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getTodayAppointments
  );

  /**
   * @swagger
   * /api/officer/appointments/upcoming:
   *   get:
   *     summary: Get upcoming appointments (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: centerId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of upcoming appointments
   */
  app.get(
    "/api/officer/appointments/upcoming",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getUpcomingAppointments
  );

  /**
   * @swagger
   * /api/officer/appointments:
   *   get:
   *     summary: Get all appointments with filtering and pagination (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, validated, rejected, missed, completed, cancelled, all]
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: centerId
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of filtered appointments
   */
  app.get(
    "/api/officer/appointments",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getAllAppointmentsOfficer
  );

  /**
   * @swagger
   * /api/officer/appointments/center/{centerId}/daily:
   *   get:
   *     summary: Get center's daily appointments (officer only)
   *     tags: [Officer Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: centerId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: List of center's daily appointments
   */
  app.get(
    "/api/officer/appointments/center/:centerId/daily",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCenterDailyAppointments
  );
};
