const controller = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Endpoints for officers and managers to view citizens
 *
 * /api/users:
 *   get:
 *     summary: Get all citizens (role = user)
 *     description: |
 *       Retrieve a paginated list of all users with the citizen role (`user`). Only accessible to users with the manager or officer role. Supports filtering and searching by the following fields:
 *         - `email`: Filter by email address (exact or partial match)
 *         - `username`: Filter by username (exact or partial match)
 *         - `id`: Filter by user ID
 *         - `firstName`: Filter by first name (exact or partial match)
 *         - `lastName`: Filter by last name (exact or partial match)
 *         - `search`: General search across username, email, first name, and last name (case-insensitive)
 *         - `page` and `limit`: Pagination controls
 *
 *       Returns a list of citizens and pagination info. Returns 403 if the requester is not a manager or officer.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email address (exact or partial match)
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter by username (exact or partial match)
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *         description: Filter by first name (exact or partial match)
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Filter by last name (exact or partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: General search across username, email, first name, and last name (case-insensitive)
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
 *         description: List of citizens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized (only manager/officer)
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get citizen by ID
 *     description: |
 *       Retrieve the details of a specific citizen by their user ID. Only accessible to users with the manager or officer role. Returns all user information except the password. Returns 403 if the requester is not a manager or officer, or 404 if the citizen does not exist.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Citizen user ID
 *     responses:
 *       200:
 *         description: Citizen details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized (only manager/officer)
 *       404:
 *         description: Citizen not found
 */

module.exports = function (app) {
  // Officers/managers: get all citizens (role = user)
  app.get("/api/users", controller.getAllCitizens);
  // Officers/managers: get citizen by ID
  app.get("/api/users/:id", controller.getUserById);
};
