const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");
const testSocket = require("../utils/testSocket");

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique notification identifier
 *         userId:
 *           type: string
 *           description: ID of the user this notification belongs to
 *         type:
 *           type: string
 *           enum: [appointment, request_status, document, system]
 *           description: Type of notification for categorization
 *         title:
 *           type: string
 *           description: Short notification title/headline
 *         message:
 *           type: string
 *           description: Detailed notification message content
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read by the user
 *           default: false
 *         metadata:
 *           type: object
 *           description: Additional data related to the notification
 *           properties:
 *             appointmentId:
 *               type: string
 *               description: ID of related appointment (if applicable)
 *             requestId:
 *               type: string
 *               description: ID of related CPF request (if applicable)
 *             documentId:
 *               type: string
 *               description: ID of related document (if applicable)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was last updated
 *       required:
 *         - userId
 *         - type
 *         - title
 *         - message
 */

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Send notification to user (officer only)
   *     tags: [Notifications]
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
   *               - title
   *               - message
   *               - type
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to send notification to
   *               title:
   *                 type: string
   *                 description: Notification title
   *               message:
   *                 type: string
   *                 description: Notification message
   *               type:
   *                 type: string
   *                 enum: [appointment, request_status, document, system]
   *                 description: Type of notification
   *               metadata:
   *                 type: object
   *                 description: Optional metadata for the notification
   *               socketEvent:
   *                 type: string
   *                 description: Optional socket event to emit with the notification
   *               socketData:
   *                 type: object
   *                 description: Optional data to send with the socket event
   *     responses:
   *       201:
   *         description: Notification sent successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.post(
    "/api/notifications",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.sendNotification
  );

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Get user's notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: read
   *         schema:
   *           type: boolean
   *         description: Filter by read status
   *     responses:
   *       200:
   *         description: List of notifications
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 notifications:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *                 totalPages:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   *                 totalNotifications:
   *                   type: integer
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/notifications",
    [authJwt.verifyToken],
    controller.getNotifications
  );

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   put:
   *     summary: Mark notification as read
   *     tags: [Notifications]
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
   *         description: Notification marked as read
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Notification not found
   */
  app.put(
    "/api/notifications/:id/read",
    [authJwt.verifyToken],
    controller.markAsRead
  );

  /**
   * @swagger
   * /api/notifications/read-all:
   *   put:
   *     summary: Mark all notifications as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   *       403:
   *         description: Not authorized
   */
  app.put(
    "/api/notifications/read-all",
    [authJwt.verifyToken],
    controller.markAllAsRead
  );

  /**
   * @swagger
   * /api/notifications/unread:
   *   get:
   *     summary: Get count of unread notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Number of unread notifications
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/notifications/unread",
    [authJwt.verifyToken],
    controller.getUnreadCount
  );

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Delete a notification
   *     tags: [Notifications]
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
   *         description: Notification deleted successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Notification not found
   */
  app.delete(
    "/api/notifications/:id",
    [authJwt.verifyToken],
    controller.deleteNotification
  );

  /**
   * @swagger
   * /api/test/socket/user/{userId}:
   *   post:
   *     summary: Test socket notification to a specific user (officer only)
   *     tags: [Socket Testing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: User ID to send test notification to
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [citizen, officer]
   *                 default: citizen
   *     responses:
   *       200:
   *         description: Test notification sent
   *       500:
   *         description: Error sending notification
   */
  app.post(
    "/api/test/socket/user/:userId",
    [authJwt.verifyToken, authJwt.isOfficer],
    async (req, res) => {
      try {
        const result = await testSocket.sendTestNotification(
          req.params.userId,
          req.body.role || "citizen"
        );
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  /**
   * @swagger
   * /api/test/socket/role/{role}:
   *   post:
   *     summary: Test socket notification to all users with a specific role (officer only)
   *     tags: [Socket Testing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: role
   *         schema:
   *           type: string
   *           enum: [citizen, officer]
   *         required: true
   *         description: Role to send test notification to
   *     responses:
   *       200:
   *         description: Test notification sent
   *       500:
   *         description: Error sending notification
   */
  app.post(
    "/api/test/socket/role/:role",
    [authJwt.verifyToken, authJwt.isOfficer],
    async (req, res) => {
      try {
        const result = await testSocket.testRoleNotification(req.params.role);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  /**
   * @swagger
   * /api/test/socket/appointment/{userId}:
   *   post:
   *     summary: Test appointment notification (officer only)
   *     tags: [Socket Testing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: User ID to send test appointment notification to
   *     responses:
   *       200:
   *         description: Test appointment notification sent
   *       500:
   *         description: Error sending notification
   */
  app.post(
    "/api/test/socket/appointment/:userId",
    [authJwt.verifyToken, authJwt.isOfficer],
    async (req, res) => {
      try {
        const result = await testSocket.testAppointmentNotification(
          req.params.userId
        );
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );

  /**
   * @swagger
   * /api/test/socket/online:
   *   get:
   *     summary: Get list of online users (officer only)
   *     tags: [Socket Testing]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of online users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 onlineUsers:
   *                   type: array
   *                   items:
   *                     type: string
   *                 onlineCount:
   *                   type: integer
   *       500:
   *         description: Error retrieving online users
   */
  app.get(
    "/api/test/socket/online",
    [authJwt.verifyToken, authJwt.isOfficer],
    (req, res) => {
      try {
        const result = testSocket.getOnlineUsers();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  );
};
