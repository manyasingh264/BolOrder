// users.controller.js — handles HTTP requests for the users module.
//
// Responsibility: Read from req, call service, send response.
//                 No business logic. No direct DB access.
//
// req.user is available here because authenticate middleware ran first.

const usersService = require('./users.service');
const sendResponse = require('../../utils/sendResponse');

// GET /api/users
// Returns all users
const getAll = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    return sendResponse(res, 200, true, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
// Returns a single user by ID
const getOne = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);
    return sendResponse(res, 200, true, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

// POST /api/users
// Creates a new employee account
const create = async (req, res, next) => {
  try {
    const newUser = await usersService.createUser(req.body);
    return sendResponse(res, 201, true, 'User created successfully', newUser);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
// Updates an existing user — any subset of allowed fields
const update = async (req, res, next) => {
  try {
    // Pass requestingUserId so service can enforce the self-deactivation rule
    const updatedUser = await usersService.updateUser(
      req.params.id,
      req.body,
      req.user.userId
    );
    return sendResponse(res, 200, true, 'User updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update };
