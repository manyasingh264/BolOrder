// auth.controller.js — handles the login HTTP request.
//
// Responsibility: Extract request data, call the service, send the response.
//                 No business logic lives here.
//
// The controller is intentionally thin:
//   - req.body is already validated by validateRequest middleware
//   - Business rules are in auth.service.js
//   - DB access is in auth.repository.js

const authService = require('./auth.service');
const sendResponse = require('../../utils/sendResponse');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    return sendResponse(res, 200, true, 'Login successful', data);
  } catch (error) {
    next(error); // AppError or unexpected error → errorHandler middleware
  }
};

module.exports = { login };
