// scripts/seed-admin.js — creates the initial ADMIN user in the database.
//
// Run this ONCE after migrations to create the first admin account:
//   node scripts/seed-admin.js
//
// After running, you can log in at POST /api/auth/login with these credentials:
//   Email:    admin@vofm.com
//   Password: Admin@123
//
// Change the password immediately after first login in production.

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { users } = require('../src/database/schema');
const { eq } = require('drizzle-orm');

const ADMIN_USER = {
  name:     'Admin',
  email:    'admin@vofm.com',
  phone:    null,
  password: 'Admin@123',
  role:     'ADMIN',
};

const run = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool, { prepare: false });

  console.log('🌱 Seeding admin user...');

  // Check if admin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_USER.email))
    .limit(1);

  if (existing.length > 0) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    await pool.end();
    return;
  }

  // Hash the password before storing
  const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);

  await db.insert(users).values({
    name:         ADMIN_USER.name,
    email:        ADMIN_USER.email,
    phone:        ADMIN_USER.phone,
    passwordHash: passwordHash,
    role:         ADMIN_USER.role,
    isActive:     true,
  });

  console.log('✅ Admin user created successfully!');
  console.log('');
  console.log('   Email:    admin@vofm.com');
  console.log('   Password: Admin@123');
  console.log('   Role:     ADMIN');
  console.log('');
  console.log('⚠️  Change this password after your first login!');

  await pool.end();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
