// auth.repository.js — all database queries needed for authentication.
//
// Responsibility: Find a user record by email.
//                 That's the only DB operation auth needs.
//
// This is the ONLY file in the auth module that imports from the database.
// It returns plain JavaScript objects — no business logic here.

const { eq } = require('drizzle-orm');
const { db } = require('../../database/db');
const { users } = require('../../database/schema');

// Find a single user by their email address.
// Returns the full user object including passwordHash (needed for bcrypt comparison).
// Returns null if no user is found.
const findUserByEmail = async (email) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
};

module.exports = { findUserByEmail };
