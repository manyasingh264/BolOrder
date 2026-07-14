// errorHandler.middleware.js — the ONLY place where errors are turned into HTTP responses.
//
// Express recognizes an error handler by its 4-parameter signature: (err, req, res, next).
// It must be registered LAST in app.js, after all routes.
//
// Handles three categories of errors:
//   1. ZodError       → 400 Bad Request with field-level details
//   2. JWT errors     → 401 Unauthorized
//   3. AppError       → whatever status code the service set
//   4. Unknown errors → 500 Internal Server Error (and logged to console)

const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // ── 1. Zod Validation Error ────────────────────────────────────────────────
  // Happens when validateRequest middleware finds invalid request body fields.
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // ── 2. JWT Errors ─────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
    });
  }

  // ── 3. Our Custom AppError ────────────────────────────────────────────────
  // Thrown intentionally by services: throw new AppError('Not found', 404)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ── 4. Unknown / Unexpected Errors ────────────────────────────────────────
  // Something crashed that we didn't anticipate. Log it and return a generic 500.
  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again later.',
  });
};

module.exports = errorHandler;
