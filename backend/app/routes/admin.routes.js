const controller = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin dashboard endpoints for managing managers and officers (no authentication required)
 *
 * /api/admin/users:
 *   get:
 *     summary: List all managers and officers
 *     description: |
 *       Retrieve a paginated list of all users with the role of manager or officer. You can filter results by role (`manager` or `officer`), status (`pending`, `active`, `blocked`), or search by username/email. Supports pagination with `page` and `limit` query parameters.
 *
 *       - Use `role` to filter by user type (manager or officer).
 *       - Use `status` to filter by account status.
 *       - Use `search` to find users by username or email (case-insensitive).
 *       - Use `page` and `limit` for pagination.
 *
 *       Returns a list of users and pagination info.
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role (manager or officer)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, blocked]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of managers and officers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get manager/officer by ID
 *     description: |
 *       Retrieve the details of a specific manager or officer by their user ID. Returns all user information except the password. If the user does not exist, returns 404.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Manager/officer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete manager/officer
 *     description: |
 *       Permanently delete a manager or officer by their user ID. This action cannot be undone. If the user does not exist, returns 404.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update manager/officer status (activate, block, unblock)
 *     description: |
 *       Change the status of a manager or officer. The status field controls account activation:
 *         - `pending`: Default status for new users (not yet activated). **Cannot be set again after the user is activated or blocked.**
 *         - `active`: Activates or unblocks the user (use for both activate and unblock actions)
 *         - `blocked`: Blocks the user (prevents login)
 *
 *       To activate or unblock a user, set status to `active`. To block a user, set status to `blocked`. New users are created with `pending` by default.
 *
 *       **Note:** After a user is activated or blocked, only `active` and `blocked` are valid status options. Attempts to set status back to `pending` will result in a 400 error.
 *
 *       The `isActive` field will be synchronized automatically based on the status.
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, blocked]
 *                 description: New status for the user (isActive will be synchronized automatically)
 *           example:
 *             status: active
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid status
 *       404:
 *         description: User not found
 */

module.exports = function (app) {
  // List all managers and officers, with optional filters (role, status, search)
  app.get("/api/admin/users", controller.getAllWorkers);

  // Get user details
  app.get("/api/admin/users/:id", controller.getUserById);

  // Update user status (activate, block, unblock)
  app.put("/api/admin/users/:id/status", controller.updateUserStatus);

  // Delete user
  app.delete("/api/admin/users/:id", controller.deleteUser);
};
