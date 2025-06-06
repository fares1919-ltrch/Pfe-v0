const { authJwt } = require("../middlewares");
const controller = require("../controllers/profile.controller");
const upload = require("../middlewares/upload");

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *         nationality:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  /**
   * @swagger
   * /api/profile:
   *   get:
   *     summary: Get current user's profile
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Profile'
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Profile not found
   */
  app.get("/api/profile", [authJwt.verifyToken], controller.getProfile);

  /**
   * @swagger
   * /api/profile:
   *   put:
   *     summary: Update current user's profile
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Profile'
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Invalid input data
   *       403:
   *         description: Not authorized
   */
  app.put(
    "/api/profile",
    [authJwt.verifyToken, upload.single("photo")],
    controller.updateProfile
  );

  /**
   * @swagger
   * /api/profile/location:
   *   patch:
   *     summary: Update user's location with coordinates
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               address:
   *                 type: string
   *                 description: User's address from map selection
   *               coordinates:
   *                 type: object
   *                 properties:
   *                   lat:
   *                     type: number
   *                     description: Latitude coordinate
   *                   lon:
   *                     type: number
   *                     description: Longitude coordinate
   *     responses:
   *       200:
   *         description: Location updated successfully
   *       400:
   *         description: Invalid coordinates
   *       403:
   *         description: Not authorized
   */
  app.patch(
    "/api/profile/location",
    [authJwt.verifyToken],
    controller.updateLocation
  );

  /**
   * @swagger
   * /api/profile:
   *   delete:
   *     summary: Delete current user's profile
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile deleted successfully
   *       403:
   *         description: Not authorized
   */
  app.delete("/api/profile", [authJwt.verifyToken], controller.deleteAccount);

  /**
   * @swagger
   * /api/profile/link-oauth:
   *   post:
   *     summary: Link OAuth account to current user's profile
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: OAuth account linked successfully
   *       403:
   *         description: Not authorized
   */
  app.post(
    "/api/profile/link-oauth",
    [authJwt.verifyToken],
    controller.linkOAuthAccount
  );

  /**
   * @swagger
   * /api/profile/sessions:
   *   get:
   *     summary: Get current user's active sessions
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Active sessions data
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/profile/sessions",
    [authJwt.verifyToken],
    controller.getActiveSessions
  );

  /**
   * @swagger
   * /api/profile/sessions/{sessionToken}:
   *   delete:
   *     summary: Revoke current user's session
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionToken
   *         schema:
   *           type: string
   *         required: true
   *         description: Session token to revoke
   *     responses:
   *       200:
   *         description: Session revoked successfully
   *       403:
   *         description: Not authorized
   */
  app.delete(
    "/api/profile/sessions/:sessionToken",
    [authJwt.verifyToken],
    controller.revokeSession
  );

  /**
   * @swagger
   * /api/profile:
   *   put:
   *     summary: Update current user's profile with photo
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               photo:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Invalid file format
   *       403:
   *         description: Not authorized
   */
  app.put(
    "/api/profile",
    [authJwt.verifyToken, upload.single("photo")],
    controller.updateProfile
  );

  /**
   * @swagger
   * /api/profile/location:
   *   patch:
   *     summary: Update user's location with coordinates
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               address:
   *                 type: string
   *                 description: User's address from map selection
   *               coordinates:
   *                 type: object
   *                 properties:
   *                   lat:
   *                     type: number
   *                     description: Latitude coordinate
   *                   lon:
   *                     type: number
   *                     description: Longitude coordinate
   *     responses:
   *       200:
   *         description: Location updated successfully
   *       400:
   *         description: Invalid coordinates
   *       403:
   *         description: Not authorized
   */
  app.patch(
    "/api/profile/location",
    [authJwt.verifyToken],
    controller.updateLocation
  );

  /**
   * @swagger
   * /api/profile/validate-cpf:
   *   get:
   *     summary: Validate if user profile is complete for appointment
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isComplete:
   *                   type: boolean
   *                   description: Whether profile is complete for appointment
   *                 missingFields:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: List of missing required fields
   *                 message:
   *                   type: string
   *                   description: Status message
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.get(
    "/api/profile/validate-cpf",
    [authJwt.verifyToken],
    controller.validateProfileForCpf
  );

  /**
   * @swagger
   * /api/profile/check-identity/{identityNumber}:
   *   get:
   *     summary: Check if identity number is unique
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: identityNumber
   *         schema:
   *           type: string
   *         required: true
   *         description: Identity number to check
   *     responses:
   *       200:
   *         description: Returns boolean indicating if the identity number is unique
   *         content:
   *           application/json:
   *             schema:
   *               type: boolean
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/profile/check-identity/:identityNumber",
    [authJwt.verifyToken],
    controller.checkIdentityNumberUnique
  );
};
