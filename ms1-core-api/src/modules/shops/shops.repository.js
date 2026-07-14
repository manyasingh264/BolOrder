// shops.repository.js — all Drizzle queries for customer shops and shop aliases.
//
// Key design decisions:
//   - findAllShops       → returns all shops (ADMIN/SUPERVISOR use this)
//   - findShopsBySalesmanId → returns only that salesman's assigned shops
//   - findShopById       → returns shop + its aliases (full detail)
//   - No hard delete — orders reference shops

const { eq } = require('drizzle-orm');
const { db } = require('../../database/db');
const { customerShops, shopAliases } = require('../../database/schema');

// Get every shop (used by ADMIN and SUPERVISOR)
const findAllShops = async () => {
  return db.query.customerShops.findMany({
    with: { aliases: true },
    orderBy: (customerShops, { asc }) => [asc(customerShops.shopName)],
  });
};

// Get only the shops assigned to a specific salesman
const findShopsBySalesmanId = async (salesmanId) => {
  return db.query.customerShops.findMany({
    where: (customerShops, { eq }) => eq(customerShops.salesmanId, salesmanId),
    with: { aliases: true },
    orderBy: (customerShops, { asc }) => [asc(customerShops.shopName)],
  });
};

// Get one shop with its aliases by ID
const findShopById = async (id) => {
  return db.query.customerShops.findFirst({
    where: (customerShops, { eq }) => eq(customerShops.id, id),
    with: { aliases: true },
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

module.exports = {
  findAllShops,
  findShopsBySalesmanId,
  findShopById,
  createShop,
  updateShop,
  createAlias,
};
