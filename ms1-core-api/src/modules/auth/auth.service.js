// auth.service.js — business logic for authentication.
//
// Responsibility: Verify credentials and issue a JWT token.
//
// Flow:
//   1. Find user by email in the database
//   2. Check if account is active
//   3. Compare submitted password with stored bcrypt hash
//   4. Sign and return a JWT + safe user object
//
// This file NEVER touches req or res — that's the controller's job.
// This file NEVER writes SQL — that's the repository's job.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authRepository = require('./auth.repository');
const AppError = require('../../utils/AppError');
const config = require('../../config/env.config');

const login = async (email, password) => {
  // Step 1: Look up the user by email
  const user = await authRepository.findUserByEmail(email);

  // Deliberately vague error — don't reveal whether the email exists
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 2: Check if the account has been deactivated by an admin
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact your administrator.',
      403
    );
  }

  // Step 3: Compare the submitted password with the stored bcrypt hash
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 4: Sign the JWT with userId and role in the payload
  // The frontend stores this token and sends it in Authorization header on every request
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Return token and a SAFE user object — never include passwordHash in the response
  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  };
};

module.exports = { login };
