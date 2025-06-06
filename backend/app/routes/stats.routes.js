const { authJwt } = require("../middlewares");
const controller = require("../controllers/stats.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Statistics:
 *       type: object
 *       properties:
 *         appointments:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             approved:
 *               type: number
 *             rejected:
 *               type: number
 *             pending:
 *               type: number
 *             completed:
 *               type: number
 *         biometrics:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             withFingerprints:
 *               type: number
 *             withFace:
 *               type: number
 *             withIris:
 *               type: number
 *         scheduledAppointments:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             completed:
 *               type: number
 *             cancelled:
 *               type: number
 *             noShow:
 *               type: number
 *             rescheduled:
 *               type: number
 */

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  /**
   * @swagger
   * /api/stats/appointments:
   *   get:
   *     summary: Get appointment statistics (manager/officer only)
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for filtering
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for filtering
   *     responses:
   *       200:
   *         description: Appointment statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Statistics'
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/stats/appointments",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getAppointmentRequestStats
  );

  /**
   * @swagger
   * /api/stats/biometrics:
   *   get:
   *     summary: Get biometric data statistics (manager/officer only)
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for filtering
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for filtering
   *     responses:
   *       200:
   *         description: Biometric data statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Statistics'
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/stats/biometrics",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getBiometricStats
  );

  /**
   * @swagger
   * /api/stats/appointment-details:
   *   get:
   *     summary: Get detailed appointment statistics (manager/officer only)
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for filtering
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for filtering
   *     responses:
   *       200:
   *         description: Detailed appointment statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Statistics'
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/stats/appointment-details",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getAppointmentStats
  );

  /**
   * @swagger
   * /api/stats/regional:
   *   get:
   *     summary: Get regional statistics (manager/officer only)
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Regional statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   region:
   *                     type: string
   *                   centers:
   *                     type: number
   *                   appointments:
   *                     type: number
   *                   completed:
   *                     type: number
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/stats/regional",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getRegionalStats
  );

  /**
   * @swagger
   * /api/stats/overview:
   *   get:
   *     summary: Get system overview statistics (manager/officer only)
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: System overview statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalAppointments:
   *                   type: number
   *                 totalCenters:
   *                   type: number
   *                 totalBiometrics:
   *                   type: number
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/stats/overview",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getSystemOverview
  );
};
