// users.routes.js — route definitions for the users module.
//
// Mounted at /api/users in routes/index.js
//
// ALL routes in this file are:
//   1. Protected by authenticate  → must have a valid JWT
//   2. Restricted by authorize    → ADMIN role only
//
// Middleware chain on every route:
//   authenticate → authorize('ADMIN') → [optional: validateRequest] → controller

const { Router } = require('express');

const usersController = require('./users.controller');
const { createUserSchema, updateUserSchema } = require('./users.validation');
const authenticate = require('../../middleware/authenticate.middleware');
const authorize = require('../../middleware/authorize.middleware');
const validateRequest = require('../../middleware/validateRequest.middleware');
const { ROLES } = require('../../constants');

const router = Router();

// Apply authentication and ADMIN-only authorization to ALL routes in this file
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// GET  /api/users        → list all employees
router.get('/', usersController.getAll);

// POST /api/users        → create a new employee account
router.post('/', validateRequest(createUserSchema), usersController.create);

// GET  /api/users/:id    → get one employee by ID
router.get('/:id', usersController.getOne);

// PATCH /api/users/:id   → update name, phone, role, isActive, or password
router.patch('/:id', validateRequest(updateUserSchema), usersController.update);

module.exports = router;
