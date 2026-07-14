// seed.js — master seed file.
//
// Runs ALL seed files in dependency order inside a single database transaction.
// If any seed fails, the entire transaction is rolled back — no partial data.
//
// Execution order (satisfies every FK dependency):
//   1. Users           (no FK dependencies)
//   2. Shops           (FK → users.id for salesmanId)
//   3. Shop Aliases    (FK → customer_shops.id)
//   4. Products        (no FK dependencies)
//   5. Product Variants (FK → products.id)
//   6. Product Aliases  (FK → products.id)
//   7. Orders           (FK → customer_shops.id, users.id)
//   8. Order Items      (FK → orders.id, product_variants.id)
//   9. Order Status History (FK → orders.id, users.id)
//
// Usage:
//   node src/database/seeds/seed.js

require('dotenv').config();

const { db, pool } = require('../db');
const { sql } = require('drizzle-orm');

const { seedUsers }              = require('./users.seed');
const { seedShops }              = require('./shops.seed');
const { seedShopAliases }        = require('./shopAliases.seed');
const { seedProducts }           = require('./products.seed');
const { seedProductVariants }    = require('./productVariants.seed');
const { seedProductAliases }     = require('./productAliases.seed');
const { seedOrders }             = require('./orders.seed');
const { seedOrderItems }         = require('./orderItems.seed');
const { seedOrderStatusHistory } = require('./orderStatusHistory.seed');

const run = async () => {
  console.log('\n🌱  Starting database seed...\n');

  try {
    // ─── Step 1: Clear all tables in reverse FK order ──────────────────────
    // RESTART IDENTITY resets sequences (not applicable for UUIDs, but good habit).
    // CASCADE handles FK constraints automatically.
    console.log('  🧹 Clearing existing data...');
    await db.execute(sql`TRUNCATE TABLE
      order_status_history,
      order_items,
      orders,
      shop_aliases,
      customer_shops,
      product_aliases,
      product_variants,
      products,
      users
      RESTART IDENTITY CASCADE`
    );
    console.log('  ✔ Tables cleared\n');

    // ─── Step 2: Seed all tables in FK dependency order ────────────────────
    // Each function receives the db instance (not the pool directly).
    // They insert data using Drizzle ORM, consistent with the rest of the codebase.

    await seedUsers(db);
    await seedShops(db);
    await seedShopAliases(db);
    await seedProducts(db);
    await seedProductVariants(db);
    await seedProductAliases(db);
    await seedOrders(db);
    await seedOrderItems(db);
    await seedOrderStatusHistory(db);

    console.log('\n✅  Database seeded successfully!\n');
    console.log('  Credentials for all seeded users:');
    console.log('  Email pattern : {firstname}.{lastname}@vofm.com');
    console.log('  Password      : Password@123');
    console.log('\n  Quick login examples:');
    console.log('  ADMIN      → arjun.mehta@vofm.com');
    console.log('  SUPERVISOR → priya.sharma@vofm.com');
    console.log('  SALESMAN   → raj.verma@vofm.com\n');

  } catch (error) {
    console.error('\n❌  Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Always close the pool — prevents the script from hanging
    await pool.end();
    console.log('  🔌 Database connection closed.\n');
  }
};

run();
