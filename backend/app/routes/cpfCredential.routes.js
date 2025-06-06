const { authJwt } = require("../middlewares");
const controller = require("../controllers/cpfCredential.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     CPFCredential:
 *       type: object
 *       required:
 *         - userId
 *         - appointmentId
 *         - cpfNumber
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the credential
 *         userId:
 *           type: string
 *           description: ID of the user this credential belongs to
 *         appointmentId:
 *           type: string
 *           description: ID of the appointment that led to this credential
 *         cpfNumber:
 *           type: string
 *           description: The actual CPF number issued
 *         issuedDate:
 *           type: string
 *           format: date-time
 *           description: When the credential was issued
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: When the credential expires (if applicable)
 *         status:
 *           type: string
 *           enum: [active, revoked, expired]
 *           default: active
 *           description: Current status of the credential
 *         issuedBy:
 *           type: string
 *           description: ID of the officer who issued the credential
 *         revocationInfo:
 *           type: object
 *           properties:
 *             revokedBy:
 *               type: string
 *               description: ID of the officer who revoked the credential
 *             revokedAt:
 *               type: string
 *               format: date-time
 *               description: When the credential was revoked
 *             reason:
 *               type: string
 *               description: Reason for revocation
 *         verificationCode:
 *           type: string
 *           description: Code that can be used to verify the credential's authenticity
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the credential record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the credential record was last updated
 */

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  /**
   * @swagger
   * /api/cpf-credentials:
   *   post:
   *     summary: Issue a new CPF credential (officer only)
   *     tags: [CPF Credentials]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to issue credential for
   *     responses:
   *       201:
   *         description: CPF credential issued successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFCredential'
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.post(
    "/api/cpf-credentials",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.issueCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/{userId}:
   *   get:
   *     summary: Get user's CPF credential (officer/user)
   *     tags: [CPF Credentials]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: CPF credential details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFCredential'
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Credential not found
   */
  app.get(
    "/api/cpf-credentials/:userId",
    [authJwt.verifyToken],
    controller.getCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/verify/{id}:
   *   get:
   *     summary: Verify CPF credential authenticity
   *     tags: [CPF Credentials]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Credential verification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 valid:
   *                   type: boolean
   *                   description: Whether the credential is valid
   *                 credential:
   *                   $ref: '#/components/schemas/CPFCredential'
   *                 message:
   *                   type: string
   *                   description: Verification message
   *       404:
   *         description: Credential not found
   */
  app.get("/api/cpf-credentials/verify/:id", controller.verifyCpfCredential);

  /**
   * @swagger
   * /api/cpf-credentials/{id}/revoke:
   *   put:
   *     summary: Revoke a CPF credential (officer only)
   *     tags: [CPF Credentials]
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
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Reason for revoking the credential
   *     responses:
   *       200:
   *         description: Credential revoked successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFCredential'
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Credential not found
   */
  app.put(
    "/api/cpf-credentials/:id/revoke",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.revokeCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/stats:
   *   get:
   *     summary: Get CPF credentials statistics (officer only)
   *     tags: [CPF Credentials]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: CPF credentials statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: number
   *                 active:
   *                   type: number
   *                 revoked:
   *                   type: number
   *                 issuedToday:
   *                   type: number
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/cpf-credentials/stats",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCredentialStats
  );
};
