/**
 * Centralized configuration file
 * Manages all environment variables and application settings
 */
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Configuration object with default values and environment variables
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET,
    sessionName: process.env.SESSION_NAME || 'cpf_session',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
    domain: process.env.DOMAIN || 'localhost',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    uploadDir: path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads')
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cpf_system',
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASS
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION) || 3600, // 1 hour
    refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION) || 604800 // 7 days
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL
    }
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@cpfsystem.com'
  },

  // Biometric Configuration
  biometric: {
    qualityThreshold: parseInt(process.env.BIOMETRIC_QUALITY_THRESHOLD) || 80,
    maxFileSize: parseInt(process.env.BIOMETRIC_MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: (process.env.BIOMETRIC_ALLOWED_TYPES || 'image/jpeg,image/png').split(',')
  },

  // CPF Configuration
  cpf: {
    validityPeriod: parseInt(process.env.CPF_VALIDITY_PERIOD) || 365, // days
    appointmentLimit: parseInt(process.env.CPF_APPOINTMENT_LIMIT) || 3,
    processingTime: parseInt(process.env.CPF_PROCESSING_TIME) || 30 // minutes
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: parseInt(process.env.MAX_LOG_SIZE) || 10485760, // 10MB
    maxFiles: parseInt(process.env.MAX_LOG_FILES) || 5
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'server.sessionSecret',
    'database.uri',
    'jwt.secret',
    'email.user',
    'email.pass'
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Validate configuration in production
if (config.server.env === 'production') {
  validateConfig();
}

module.exports = config; 