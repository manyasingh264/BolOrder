// drizzle.config.js — configuration for Drizzle Kit CLI.
//
// Used only by the npm scripts:
//   npm run db:generate  → reads schema.js and generates SQL migration files
//   npm run db:migrate   → applies those migrations to the database
//   npm run db:studio    → opens Drizzle Studio (visual DB browser)
//
// This file is NOT imported by the Express app at runtime.

require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './src/database/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
