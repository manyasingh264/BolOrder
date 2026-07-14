// authorize.middleware.js — Role-Based Access Control (RBAC).
//
// This is a middleware FACTORY — it takes allowed roles and RETURNS a middleware.
// It MUST run AFTER authenticate middleware (because it reads req.user.role).
//
// Usage in routes:
//   router.get('/users', authenticate, authorize('ADMIN'), controller.getAll)
//   router.get('/orders', authenticate, authorize('ADMIN', 'SUPERVISOR'), controller.getAll)
//
// If the user's role is in the allowed list → next() is called.
// If the user's role is NOT allowed         → 403 Forbidden response.

const AppError = require('../utils/AppError');

const authorize = (...allowedRoles) => (req, res, next) => {
  // req.user is set by authenticate middleware — should always exist here
  if (!req.user) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  // Check if the user's role is permitted for this route
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action.', 403)
    );
  }

  next();
};

module.exports = authorize;
