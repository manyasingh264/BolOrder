// authenticate.middleware.js — verifies the JWT on every protected route.
//
// How it works:
//   1. Reads the Authorization header: "Bearer <token>"
//   2. Extracts the token string
//   3. Verifies it with jwt.verify() using the JWT_SECRET from .env
//   4. Attaches decoded { userId, role } to req.user
//   5. Calls next() so the request continues
//
// If the token is missing, expired, or tampered → returns 401 Unauthorized.
// JWT errors (JsonWebTokenError, TokenExpiredError) are handled by errorHandler.
//
// Usage in routes:
//   router.get('/users', authenticate, authorize('ADMIN'), usersController.getAll)

const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check that the Authorization header exists and follows "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.',
    });
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError on failure.
    // Both are handled by the centralized errorHandler in app.js.
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach only what controllers and authorize middleware need
    req.user = {
      userId: decoded.userId,
      role:   decoded.role,
    };

    next();
  } catch (error) {
    next(error); // JWT errors → errorHandler → 401 response
  }
};

module.exports = authenticate;
