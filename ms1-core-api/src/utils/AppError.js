// AppError is a custom Error class that carries an HTTP status code.
// Usage: throw new AppError('Shop not found', 404)
//
// Why extend Error? So we can use instanceof checks in the error handler
// to distinguish OUR intentional errors from unexpected bugs.
//
// isOperational = true means "this is a known, expected error".
// isOperational = false (default for Error) means "something crashed unexpectedly".

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
