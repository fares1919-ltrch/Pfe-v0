const { authJwt } = require("../middlewares");
const controller = require("../controllers/password.controller");
const rateLimit = require("express-rate-limit");

/**
 * @swagger
 * components:
 *   schemas:
 *     PasswordReset:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *     PasswordUpdate:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 */

// Create a limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    message:
      "Too many password reset requests from this IP, please try again after an hour",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  /**
   * @swagger
   * /api/password/forgot:
   *   post:
   *     summary: Request password reset
   *     tags: [Password]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PasswordReset'
   *     responses:
   *       200:
   *         description: Password reset email sent
   *       404:
   *         description: Email not found
   *       400:
   *         description: Invalid email format
   */
  app.post(
    "/api/password/forgot",
    passwordResetLimiter,
    controller.forgotPassword
  );

  /**
   * @swagger
   * /api/password/reset/{token}:
   *   post:
   *     summary: Reset password using token
   *     tags: [Password]
   *     parameters:
   *       - in: path
   *         name: token
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
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password reset successful
   *       400:
   *         description: Invalid or expired token
   */
  app.post("/api/password/reset/:token", controller.resetPassword);

  /**
   * Also support reset via token in the body for backward compatibility
   */
  app.post("/api/password/reset", controller.resetPassword);

  /**
   * @swagger
   * /api/password/change:
   *   post:
   *     summary: Change password (requires authentication)
   *     tags: [Password]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PasswordUpdate'
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Invalid current password
   *       403:
   *         description: Not authorized
   */
  app.post(
    "/api/password/change",
    [authJwt.verifyToken],
    controller.changePassword
  );
};
