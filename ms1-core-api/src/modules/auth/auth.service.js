// auth.service.js — business logic for authentication.
//
// Responsibility: Verify credentials, issue JWT tokens, and handle OTP-based authentication.
//
// Flow:
//   Password Login:
//   1. Find user by email in the database
//   2. Check if account is active
//   3. Compare submitted password with stored bcrypt hash
//   4. Sign and return a JWT + safe user object
//
//   OTP Login:
//   1. Find user by email in the database
//   2. Check if account is active
//   3. Generate OTP and send via email
//   4. Verify OTP and issue JWT if valid
//
// This file NEVER touches req or res — that's the controller's job.
// This file NEVER writes SQL — that's the repository's job.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authRepository = require('./auth.repository');
const emailService = require('../../services/email.service');
const otpService = require('../../services/otp.service');
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

/**
 * Send OTP to user's email for authentication
 * @param {string} email - User's email address
 * @returns {Promise<{message: string}>}
 */
const sendOTP = async (email) => {
  // Step 1: Look up the user by email
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError('User not found with this email', 404);
  }

  // Step 2: Check if the account is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact your administrator.',
      403
    );
  }

  // Step 3: Generate OTP
  const otp = otpService.generateOTP();

  // Step 4: Store OTP in database
  await otpService.storeOTP(email, otp);

  // Step 5: Send OTP via email
  await emailService.sendOTPEmail(email, otp);

  return {
    message: 'OTP sent successfully to your email',
  };
};

/**
 * Verify OTP and login user
 * @param {string} email - User's email address
 * @param {string} otp - OTP code
 * @returns {Promise<{token: string, user: object}>}
 */
const verifyOTPAndLogin = async (email, otp) => {
  // Step 1: Look up the user by email
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError('User not found with this email', 404);
  }

  // Step 2: Check if the account is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact your administrator.',
      403
    );
  }

  // Step 3: Verify OTP
  const isValid = await otpService.verifyOTP(email, otp);

  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 401);
  }

  // Step 4: Sign the JWT with userId and role in the payload
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Return token and a SAFE user object
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

module.exports = { login, sendOTP, verifyOTPAndLogin };
