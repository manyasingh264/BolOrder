// schema.js — defines ALL database tables using Drizzle ORM.
//
// This is the single source of truth for the database structure.
// Drizzle Kit reads this file to generate SQL migration files.
// Repositories import individual tables from here.
//
// Table list (matches the ERD):
//   1. users
//   2. customerShops
//   3. shopAliases
//   4. products
//   5. productVariants
//   6. productAliases
//   7. orders
//   8. orderItems
//   9. orderStatusHistory

const {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
} = require('drizzle-orm/pg-core');

const { relations } = require('drizzle-orm');

// ─── Enums ────────────────────────────────────────────────────────────────────
// Using pgEnum creates a proper PostgreSQL ENUM type in the database.
// This is better than a plain text column because PostgreSQL enforces valid values.

const roleEnum = pgEnum('role', ['ADMIN', 'SUPERVISOR', 'SALESMAN']);

const orderStatusEnum = pgEnum('order_status', [
  'DRAFT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
]);

// ─── 1. Users ─────────────────────────────────────────────────────────────────
// Factory employees who use this system.
// Three roles: ADMIN, SUPERVISOR, SALESMAN.

const users = pgTable('users', {
  id:           uuid('id').defaultRandom().primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  phone:        text('phone'),
  passwordHash: text('password_hash').notNull(),
  role:         roleEnum('role').notNull().default('SALESMAN'),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
});

// ─── 2. Customer Shops ────────────────────────────────────────────────────────
// Retailer shops that salesmen visit.
// Each shop is assigned to one salesman (salesmanId).

const customerShops = pgTable('customer_shops', {
  id:         uuid('id').defaultRandom().primaryKey(),
  shopName:   text('shop_name').notNull(),
  ownerName:  text('owner_name'),
  phone:      text('phone'),
  address:    text('address'),
  isVerified: boolean('is_verified').default(false).notNull(),
  salesmanId: uuid('salesman_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});

// ─── 3. Shop Aliases ──────────────────────────────────────────────────────────
// Alternative names for a shop used in speech (e.g. "Sharma ki dukaan").
// The AI uses these for fuzzy matching.

const shopAliases = pgTable('shop_aliases', {
  id:     uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').notNull().references(() => customerShops.id, { onDelete: 'cascade' }),
  alias:  text('alias').notNull(),
});

// ─── 4. Products ──────────────────────────────────────────────────────────────
// Namkeen products made by the factory (e.g. "Aloo Bhujia", "Mixture").

const products = pgTable('products', {
  id:          uuid('id').defaultRandom().primaryKey(),
  name:        text('name').notNull(),
  category:    text('category'),
  description: text('description'),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
});

// ─── 5. Product Variants ──────────────────────────────────────────────────────
// Each product can have multiple sizes/units (e.g. 200g, 500g, 1kg).
// price is stored here because price varies per variant.

const productVariants = pgTable('product_variants', {
  id:        uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size:      text('size'),
  unit:      text('unit').notNull(),
  sku:       text('sku').unique(),
  price:     decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── 6. Product Aliases ───────────────────────────────────────────────────────
// Alternative names for a product used in speech (e.g. "bhujiya", "aloo wala").
// The AI uses these for fuzzy matching when extracting orders.

const productAliases = pgTable('product_aliases', {
  id:        uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  alias:     text('alias').notNull(),
});

// ─── 7. Orders ────────────────────────────────────────────────────────────────
// The core entity. Created when a salesman places an order (voice or manual).
// salesmanId  = who is visiting the shop today
// createdBy   = who initiated this order record (usually same as salesmanId)
// rawTranscript = the original Hindi/Hinglish speech text from AI

const orders = pgTable('orders', {
  id:            uuid('id').defaultRandom().primaryKey(),
  shopId:        uuid('shop_id').notNull().references(() => customerShops.id),
  salesmanId:    uuid('salesman_id').notNull().references(() => users.id),
  createdBy:     uuid('created_by').notNull().references(() => users.id),
  status:        orderStatusEnum('status').notNull().default('DRAFT'),
  rawTranscript: text('raw_transcript'),
  confirmedAt:   timestamp('confirmed_at'),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

// ─── 8. Order Items ───────────────────────────────────────────────────────────
// Line items within an order. Each item references a specific product variant.
// unitPrice is stored here (not read from productVariants) so historical prices
// are preserved even if the product price changes later.

const orderItems = pgTable('order_items', {
  id:               uuid('id').defaultRandom().primaryKey(),
  orderId:          uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productVariantId: uuid('product_variant_id').notNull().references(() => productVariants.id),
  quantity:         integer('quantity').notNull(),
  unitPrice:        decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal:         decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// ─── 9. Order Status History ──────────────────────────────────────────────────
// Audit trail — every time an order's status changes, a record is added here.
// This allows the dashboard to show a full timeline of each order.

const orderStatusHistory = pgTable('order_status_history', {
  id:        uuid('id').defaultRandom().primaryKey(),
  orderId:   uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
  remarks:   text('remarks'),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
// Relations tell Drizzle how tables relate for the db.query.* relational API.
// These do NOT create SQL constraints — foreign key columns above handle that.

const usersRelations = relations(users, ({ many }) => ({
  assignedShops: many(customerShops),
  orders:        many(orders),
}));

const customerShopsRelations = relations(customerShops, ({ one, many }) => ({
  salesman: one(users, {
    fields: [customerShops.salesmanId],
    references: [users.id],
  }),
  aliases: many(shopAliases),
  orders:  many(orders),
}));

const shopAliasesRelations = relations(shopAliases, ({ one }) => ({
  shop: one(customerShops, {
    fields: [shopAliases.shopId],
    references: [customerShops.id],
  }),
}));

const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  aliases:  many(productAliases),
}));

const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product:    one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
}));

const productAliasesRelations = relations(productAliases, ({ one }) => ({
  product: one(products, {
    fields: [productAliases.productId],
    references: [products.id],
  }),
}));

const ordersRelations = relations(orders, ({ one, many }) => ({
  shop:          one(customerShops, {
    fields: [orders.shopId],
    references: [customerShops.id],
  }),
  salesman:      one(users, {
    fields: [orders.salesmanId],
    references: [users.id],
    relationName: 'orderSalesman',
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
    relationName: 'orderCreatedBy',
  }),
  items:         many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order:          one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order:     one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  updatedBy: one(users, {
    fields: [orderStatusHistory.updatedBy],
    references: [users.id],
  }),
}));

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  // Enums
  roleEnum,
  orderStatusEnum,

  // Tables
  users,
  customerShops,
  shopAliases,
  products,
  productVariants,
  productAliases,
  orders,
  orderItems,
  orderStatusHistory,

  // Relations
  usersRelations,
  customerShopsRelations,
  shopAliasesRelations,
  productsRelations,
  productVariantsRelations,
  productAliasesRelations,
  ordersRelations,
  orderItemsRelations,
  orderStatusHistoryRelations,
};
