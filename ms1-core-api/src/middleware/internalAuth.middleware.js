// internalAuth.middleware.js — validates requests from MS2 to internal routes.
//
// MS2 sends header: X-Service-Key: <MS2_SERVICE_SECRET>
// This ensures only MS2 can call the internal context/order/shop APIs.
// The browser never touches these routes.

const AppError = require('../utils/AppError');

const internalAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  const expectedKey = process.env.MS2_SERVICE_SECRET;

  if (!expectedKey) {
    return next(new AppError('Internal service auth not configured.', 500));
  }

  if (!serviceKey || serviceKey !== expectedKey) {
    return next(new AppError('Forbidden: invalid or missing service key.', 403));
  }

  next();
};

module.exports = internalAuth;
