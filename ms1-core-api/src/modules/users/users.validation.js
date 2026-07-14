// users.validation.js — Zod schemas for the Users module.
//
// createUserSchema: validates the request body for POST /api/users
// updateUserSchema: validates the request body for PATCH /api/users/:id
//                   All fields are optional — admin can update any subset.

const { z } = require('zod');
const { ROLES } = require('../../constants');

// ─── Create User ──────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),

  phone: z
    .string()
    .optional(),

  role: z.enum([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be ADMIN, SUPERVISOR, or SALESMAN',
  }),
});

// ─── Update User ──────────────────────────────────────────────────────────────
// .partial() makes every field optional so admin can update just one field at a time
const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  role: z.enum([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

module.exports = { createUserSchema, updateUserSchema };
