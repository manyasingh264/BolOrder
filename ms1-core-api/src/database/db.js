// db.js — creates the single Drizzle ORM database connection instance.
//
// This is the ONLY file in the entire project that imports 'pg' and
// creates a connection pool. Every repository imports `db` from here.
//
// Compatible with Supabase (managed PostgreSQL).
// Use the "Session pooler" or "Direct connection" string from:
// Supabase Dashboard → Settings → Database → Connection string
//
// DO NOT use the "Transaction pooler" (port 6543) — it breaks migrations.

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

const config = require('../config/env.config');
const schema = require('./schema');

// ssl: { rejectUnauthorized: false } → Supabase requires SSL on all connections
// max: 10                            → pool up to 10 simultaneous DB connections
const pool = new Pool({
  connectionString: config.db.url,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// prepare: false → required for Supabase connection pooler compatibility
// Without this, the pooler throws "prepared statement already exists" errors.
const db = drizzle(pool, { schema, prepare: false });

// Export pool so seed scripts can call pool.end() to close the connection gracefully.
module.exports = { db, pool };
