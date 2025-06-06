const { authJwt } = require("../middlewares");
const controller = require("../controllers/biometric.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Biometric:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Biometric data ID
 *         userId:
 *           type: string
 *           description: User ID this biometric data belongs to
 *         faceImage:
 *           type: boolean
 *           description: Whether face image exists
 *         irisCount:
 *           type: number
 *           description: Number of iris images (0-2)
 *         fingerprintCount:
 *           type: number
 *           description: Number of fingerprint images (0-10)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/biometrics:
   *   post:
   *     summary: Upload and store biometric data (face, iris, fingerprints)
   *     tags: [Biometrics]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user this biometric data belongs to
   *               imageFace:
   *                 type: string
   *                 format: binary
   *                 description: Face image
   *               imageIrisLeft:
   *                 type: string
   *                 format: binary
   *                 description: Left iris image
   *               imageIrisRight:
   *                 type: string
   *                 format: binary
   *                 description: Right iris image
   *               imageFingerprintRightThumb:
   *                 type: string
   *                 format: binary
   *                 description: Right thumb fingerprint
   *               imageFingerprintRightIndex:
   *                 type: string
   *                 format: binary
   *                 description: Right index fingerprint
   *               imageFingerprintRightMiddle:
   *                 type: string
   *                 format: binary
   *                 description: Right middle fingerprint
   *               imageFingerprintRightRing:
   *                 type: string
   *                 format: binary
   *                 description: Right ring fingerprint
   *               imageFingerprintRightLittle:
   *                 type: string
   *                 format: binary
   *                 description: Right little fingerprint
   *               imageFingerprintLeftThumb:
   *                 type: string
   *                 format: binary
   *                 description: Left thumb fingerprint
   *               imageFingerprintLeftIndex:
   *                 type: string
   *                 format: binary
   *                 description: Left index fingerprint
   *               imageFingerprintLeftMiddle:
   *                 type: string
   *                 format: binary
   *                 description: Left middle fingerprint
   *               imageFingerprintLeftRing:
   *                 type: string
   *                 format: binary
   *                 description: Left ring fingerprint
   *               imageFingerprintLeftLittle:
   *                 type: string
   *                 format: binary
   *                 description: Left little fingerprint
   *     responses:
   *       201:
   *         description: Biometric data uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Biometric'
   *       400:
   *         description: Invalid input or file format
   *       401:
   *         description: Unauthorized
   *       409:
   *         description: Biometric data already exists for this user
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 biometricId:
   *                   type: string
   *       500:
   *         description: Server error
   */
  app.post(
    "/api/biometrics",
    [
      authJwt.verifyToken,
      controller.uploadBiometricImages
    ],
    controller.createBiometric
  );

  /**
   * @swagger
   * /api/biometrics/user/{userId}:
   *   get:
   *     summary: Get biometric data for a specific user
   *     tags: [Biometrics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID to get biometric data for
   *     responses:
   *       200:
   *         description: Biometric data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Biometric'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Biometric data not found
   *       500:
   *         description: Server error
   */
  app.get(
    "/api/biometrics/user/:userId",
    [authJwt.verifyToken],
    controller.getBiometricByUserId
  );
}; 