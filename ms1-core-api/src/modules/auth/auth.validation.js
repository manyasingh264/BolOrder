// auth.validation.js — Zod schema for the login request body.
//
// This schema is used by validateRequest middleware on the POST /api/auth/login route.
// If the request body doesn't match, a 400 error is returned before the controller runs.

const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

const sendOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
});

const verifyOTPSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be 6 digits'),
});

module.exports = { loginSchema, sendOTPSchema, verifyOTPSchema };
