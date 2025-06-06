/**
 * Centralized error handling middleware
 * Provides consistent error responses across the application
 */

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error status codes mapping
const statusCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error messages mapping
const errorMessages = {
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  INTERNAL_SERVER: 'Internal Server Error',
  SERVICE_UNAVAILABLE: 'Service Unavailable'
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.userId || 'Not authenticated'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(statusCodes.NOT_FOUND, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new ApiError(statusCodes.CONFLICT, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = new ApiError(statusCodes.BAD_REQUEST, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new ApiError(statusCodes.UNAUTHORIZED, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new ApiError(statusCodes.UNAUTHORIZED, message);
  }

  // Default error
  const statusCode = error.statusCode || statusCodes.INTERNAL_SERVER;
  const message = error.message || errorMessages.INTERNAL_SERVER;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.status(statusCodes.NOT_FOUND).json({
    success: false,
    error: {
      message: `Not Found - ${req.originalUrl}`
    }
  });
};

module.exports = {
  ApiError,
  statusCodes,
  errorMessages,
  errorHandler,
  notFoundHandler
};
