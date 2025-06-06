// Import required dependencies
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const dbConfig = require("./app/config/db.config.js");
const session = require("express-session");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const scheduleMonthlyUpdate = require("./app/cron/generateMonthlySchedules");
const scheduleMissedAppointmentDetection = require("./app/cron/detectMissedAppointments");
const setupScheduledTasks = require("./app/utils/scheduleTasks");

const {
  errorHandler,
  notFoundHandler,
} = require("./app/middlewares/errorHandler");
const config = require("./app/config/config");
require("./app/config/passport"); // Load Passport config
require("dotenv").config();

scheduleMonthlyUpdate(); // lance le cron automatiquement
scheduleMissedAppointmentDetection(); // lance le cron de détection des rendez-vous manqués

// Initialize Express application
const app = express();

// ===== SECURITY MIDDLEWARE =====

// Apply Helmet security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Configure CORS options
var corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:4200",
  credentials: true,
  allowHeaders: [
    "Origin, Content-Type, Accept, Authorization, X-Requested-With",
    "Access-Control-Allow-Origin",
  ],
  exposedHeaders: ["Content-Disposition"],
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight request for all routes

// Configure rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== PARSING MIDDLEWARE =====

// Parse cookies
app.use(cookieParser());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===== SESSION & AUTHENTICATION =====

// Configure session middleware with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "COOKIE_SECRET",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // Session TTL in seconds (1 day)
      autoRemove: "native", // Use MongoDB's TTL index for automatic removal
      touchAfter: 24 * 3600, // Only update session every 24 hours unless data changes
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
    },
    name: "sessionId", // Custom session name to avoid conflicts
  })
);

// Session activity tracking middleware
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    // Update last activity timestamp
    req.session.lastActivity = Date.now();
  }
  next();
});

// Session timeout middleware (30 minutes of inactivity)
app.use((req, res, next) => {
  if (req.session && req.session.lastActivity) {
    const inactiveTime = Date.now() - req.session.lastActivity;
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    if (inactiveTime > maxInactiveTime) {
      // Session expired due to inactivity
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        return res.status(401).json({
          message: "Session expired due to inactivity. Please log in again.",
        });
      });
      return;
    }
  }
  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ===== STATIC FILES =====

// Serve static files from uploads directory with CORS
app.use(
  "/uploads",
  (req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      process.env.CLIENT_URL || "http://localhost:4200"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "app/middlewares/uploads"))
);

// Serve static files from biometrics uploads directory with CORS
app.use(
  "/biometrics",
  (req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      process.env.CLIENT_URL || "http://localhost:4200"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "app/middlewares/uploads/biometrics"))
);

// ===== DATABASE CONNECTION =====

// Import database models
const db = require("./app/models");
const Role = db.role;

// Connect to MongoDB
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
    initial();

    // Configurer les tâches planifiées après la connexion à la base de données
    setupScheduledTasks();
  })
  .catch((err) => {
    console.error("Cannot connect to the database!", err);
    process.exit();
  });

// ===== ROUTES =====

// Simple welcome route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to fares application." });
});

// Register admin routes using the function-based approach
require("./app/routes/admin.routes")(app);

// Load all other route modules
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/profile.routes")(app);
require("./app/routes/center.routes")(app);
require("./app/routes/biometric.routes")(app);
require("./app/routes/cpfCredential.routes")(app);
require("./app/routes/appointment.routes")(app);
require("./app/routes/notification.routes")(app);
require("./app/routes/password.routes")(app);
require("./app/routes/stats.routes")(app);

// ===== API DOCUMENTATION =====

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== ERROR HANDLING =====

// Handle 404 errors - must be after all routes
app.use(notFoundHandler);

// Global error handling middleware - must be last
app.use(errorHandler);

// ===== SERVER STARTUP =====

// Set port and start server
const PORT = process.env.PORT || 8080;
const http = require("http");
const socketService = require("./app/services/socketService");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
socketService.init(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// ===== HELPER FUNCTIONS =====

// Initialize default roles if they don't exist
async function initial() {
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
      await new Role({ name: "user" }).save();
      console.log("added 'user' to roles collection");
      await new Role({ name: "manager" }).save();
      console.log("added 'manager' to roles collection");
      await new Role({ name: "officer" }).save();
      console.log("added 'officer' to roles collection");
    }
  } catch (err) {
    console.log("error", err);
  }
}

module.exports = app;
