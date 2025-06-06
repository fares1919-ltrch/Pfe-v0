const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * SocketService handles real-time notifications via Socket.IO
 * Focused on appointment status updates and notifications
 */
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.connectedRoles = new Map(); // role -> Set of socketIds
  }

  /**
   * Initialize Socket.IO with the HTTP server and set up all necessary listeners
   * @param {Object} server - HTTP server instance
   * @returns {Object} - Initialized Socket.IO instance
   */
  init(server) {
    try {
      // Step 1: Initialize Socket.IO with CORS configuration
      // This allows cross-origin requests from the frontend application
      // The origin is set from environment variables or defaults to localhost:4200
      this.io = socketIo(server, {
        cors: {
          origin: process.env.CLIENT_URL || "http://localhost:4200", // Frontend URL allowed to connect
          credentials: true, // Enables sending cookies and authentication headers
        },
      });

      // Step 2: Set up authentication middleware for socket connections
      // This ensures only authenticated users can establish socket connections
      this.io.use(async (socket, next) => {
        try {
          // Get JWT token from socket handshake
          const token = socket.handshake.auth.token;
          if (!token) {
            return next(new Error("Authentication required")); // Reject if no token
          }

          // Verify JWT token using the app's secret key
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

          // Find the user in the database to confirm they exist
          const user = await User.findById(decoded.id);
          if (!user) {
            return next(new Error("User not found")); // Reject if user no longer exists
          }

          // Attach user data to the socket for use in event handlers
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          socket.username = user.username;
          socket.email = user.email;
          next(); // Allow connection to proceed
        } catch (error) {
          console.error("Socket authentication error:", error);
          next(new Error("Invalid token")); // Reject with generic error
        }
      });

      // Step 3: Handle successful connections and track connected users
      this.io.on("connection", (socket) => {
        console.log(
          `User ${socket.userId} (${
            socket.username || socket.email || "unknown"
          }) connected`
        );

        // Store mapping from user ID to socket ID for direct messaging
        this.connectedUsers.set(socket.userId, socket.id);

        // Group sockets by user role for role-based broadcasting
        // Create a new Set for the role if it doesn't exist yet
        if (!this.connectedRoles.has(socket.userRole)) {
          this.connectedRoles.set(socket.userRole, new Set());
        }

        // Add this socket ID to the set of sockets for this role
        this.connectedRoles.get(socket.userRole).add(socket.id);

        // Step 4: Handle disconnection and clean up resources
        socket.on("disconnect", () => {
          console.log(`User ${socket.userId} disconnected`);

          // Remove user from the connected users map
          this.connectedUsers.delete(socket.userId);

          // Remove user from the role-based tracking
          if (this.connectedRoles.has(socket.userRole)) {
            // Remove this socket ID from the role's set
            this.connectedRoles.get(socket.userRole).delete(socket.id);

            // If no more users with this role are connected, remove the role entry
            if (this.connectedRoles.get(socket.userRole).size === 0) {
              this.connectedRoles.delete(socket.userRole);
            }
          }
        });
      });

      // Return the initialized Socket.IO instance for use elsewhere
      return this.io;
    } catch (error) {
      console.error("Error initializing socket service:", error);
      throw error; // Propagate error to caller
    }
  }

  /**
   * Notify a specific user via socket in real-time
   * @param {string} userId - User ID to notify
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  notifyUser(userId, event, data) {
    try {
      // Check if Socket.IO is initialized
      if (!this.io) {
        console.warn("Socket.IO not initialized, cannot send notification");
        return;
      }

      // Check if the user is currently online (has an active socket connection)
      if (this.connectedUsers.has(userId)) {
        // Get the user's socket ID from our mapping
        const socketId = this.connectedUsers.get(userId);

        // Emit the event directly to this specific socket
        // This ensures only the intended recipient receives the notification
        this.io.to(socketId).emit(event, data);
      }
    } catch (error) {
      console.error(`Error notifying user ${userId}:`, error);
    }
  }

  /**
   * Notify all users with a specific role (e.g., all officers)
   * This is used for broadcasting updates to all users in a particular group
   * @param {string} role - User role to notify (e.g., 'officer', 'admin')
   * @param {string} event - Event name to emit
   * @param {Object} data - Data payload to send with the event
   */
  notifyRole(role, event, data) {
    try {
      // Check if Socket.IO is initialized
      if (!this.io) {
        console.warn("Socket.IO not initialized, cannot send notification");
        return;
      }

      // Check if there are any online users with this role
      if (this.connectedRoles.has(role)) {
        // Get all socket IDs for users with this role
        const socketIds = Array.from(this.connectedRoles.get(role));

        // Emit the event to each socket in this role group
        // This broadcasts the message to all online users with the specified role
        socketIds.forEach((socketId) => {
          this.io.to(socketId).emit(event, data);
        });
      }
    } catch (error) {
      console.error(`Error notifying role ${role}:`, error);
    }
  }

  /**
   * Broadcast to all connected users
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  broadcast(event, data) {
    try {
      if (!this.io) {
        console.warn("Socket.IO not initialized, cannot broadcast");
        return;
      }

      this.io.emit(event, data);
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  }

  /**
   * Get list of online users
   * @returns {Array} - Array of user IDs
   */
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is online
   * @param {string} userId - User ID to check
   * @returns {boolean} - Whether user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = new SocketService();
