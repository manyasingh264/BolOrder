// shops.repository.js — all Drizzle queries for customer shops and shop aliases.
//
// Key design decisions:
//   - findAllShops       → returns all shops (ADMIN/SUPERVISOR use this)
//   - findShopsBySalesmanId → returns only that salesman's assigned shops
//   - findShopById       → returns shop + its aliases (full detail)
//   - No hard delete — orders reference shops

const { eq, inArray } = require('drizzle-orm');
const { db } = require('../../database/db');
const { customerShops, shopAliases, orders } = require('../../database/schema');

// Get every shop (used by ADMIN and SUPERVISOR) - only active shops
const findAllShops = async () => {
  return db.query.customerShops.findMany({
    where: (customerShops, { eq }) => eq(customerShops.isActive, true),
    with: {
      aliases: true,
      salesman: true,
    },
    orderBy: (customerShops, { asc }) => [asc(customerShops.shopName)],
  });
};

// Get only the shops assigned to a specific salesman - only active shops
const findShopsBySalesmanId = async (salesmanId) => {
  return db.query.customerShops.findMany({
    where: (customerShops, { and, eq }) => and(
      eq(customerShops.salesmanId, salesmanId),
      eq(customerShops.isActive, true)
    ),
    with: {
      aliases: true,
      salesman: true,
    },
    orderBy: (customerShops, { asc }) => [asc(customerShops.shopName)],
  });
};

// Get active shops that a specific salesman has placed at least one order from.
// This is the salesman's personal shop history — no other salesman's data.
const findShopsOrderedBySalesman = async (salesmanId) => {
  // Step 1: get distinct shopIds from this salesman's orders only
  const rows = await db
    .selectDistinct({ shopId: orders.shopId })
    .from(orders)
    .where(eq(orders.salesmanId, salesmanId));

  const shopIds = rows.map((r) => r.shopId).filter(Boolean);

  if (shopIds.length === 0) return [];

  // Step 2: fetch those shops with full detail
  return db.query.customerShops.findMany({
    where: (customerShops) => inArray(customerShops.id, shopIds),
    with: {
      aliases: true,
      salesman: true,
    },
    orderBy: (customerShops, { asc }) => [asc(customerShops.shopName)],
  });
};

// Get one shop with its aliases by ID
const findShopById = async (id) => {
  return db.query.customerShops.findFirst({
    where: (customerShops, { eq }) => eq(customerShops.id, id),
    with: { 
      aliases: true,
      salesman: true,
    },
  });
};

// Insert a new shop
const createShop = async (shopData) => {
  const result = await db
    .insert(customerShops)
    .values(shopData)
    .returning();

  return result[0];
};

// Update a shop by ID
const updateShop = async (id, updateData) => {
  const result = await db
    .update(customerShops)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(customerShops.id, id))
    .returning();

  return result[0] || null;
};

// Add an alias to a shop
const createAlias = async (aliasData) => {
  const result = await db
    .insert(shopAliases)
    .values(aliasData)
    .returning();

  return result[0];
};

// Soft delete a shop by ID (set isActive = false)
const deleteShop = async (id) => {
  const result = await db
    .update(customerShops)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(customerShops.id, id))
    .returning();

  return result[0] || null;
};

module.exports = {
  findAllShops,
  findShopsBySalesmanId,
  findShopsOrderedBySalesman,
  findShopById,
  createShop,
  updateShop,
  createAlias,
  deleteShop,
};