// users.repository.js — all Drizzle queries on the users table.
//
// IMPORTANT: findAllUsers and findUserById deliberately EXCLUDE passwordHash.
//            Password hashes must NEVER be sent to the frontend.
//            Only auth.repository.js includes passwordHash (for login verification).

const { eq, ne } = require('drizzle-orm');
const { db } = require('../../database/db');
const { users } = require('../../database/schema');

// Columns that are safe to return to the frontend — no password hash
const SAFE_COLUMNS = {
  id:        users.id,
  name:      users.name,
  email:     users.email,
  phone:     users.phone,
  role:      users.role,
  isActive:  users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

// Get all users (safe columns only)
const findAllUsers = async () => {
  return db.select(SAFE_COLUMNS).from(users);
};

// Get one user by ID (safe columns only)
const findUserById = async (id) => {
  const result = await db
    .select(SAFE_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] || null;
};

// Check if an email is already taken (used before creating/updating)
const findUserByEmail = async (email) => {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
};

// Insert a new user and return the created record (safe columns only)
const createUser = async (userData) => {
  const result = await db
    .insert(users)
    .values(userData)
    .returning(SAFE_COLUMNS);

  return result[0];
};

// Update a user by ID and return the updated record (safe columns only)
const updateUser = async (id, updateData) => {
  const result = await db
    .update(users)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(SAFE_COLUMNS);

  return result[0] || null;
};

module.exports = {
  findAllUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
};
