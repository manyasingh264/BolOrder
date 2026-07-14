// auth.routes.js — defines all routes for the auth module.
//
// Mounted at /api/auth in routes/index.js
// So the full URL is: POST /api/auth/login
//
// Middleware order on the login route:
//   1. validateRequest(loginSchema) → rejects invalid body with 400
//   2. authController.login         → processes valid request

const { Router } = require('express');

const authController = require('./auth.controller');
const { loginSchema } = require('./auth.validation');
const validateRequest = require('../../middleware/validateRequest.middleware');

const router = Router();

// POST /api/auth/login
// Public route — no authentication required (this IS the authentication endpoint)
router.post('/login', validateRequest(loginSchema), authController.login);

module.exports = router;
