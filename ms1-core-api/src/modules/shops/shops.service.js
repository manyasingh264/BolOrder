// shops.service.js — business logic for customer shops.
//
// Role-based data access rules enforced here:
//   ADMIN      → can see all shops, create, update, add aliases
//   SUPERVISOR → can see all shops, create, update, add aliases
//   SALESMAN   → READ ONLY, sees shops that have at least one order
//
// These rules are enforced by checking req.user.role (passed in as requestingUser).

const shopsRepository = require('./shops.repository');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants');

// ─── Get All Shops ────────────────────────────────────────────────────────────
// ADMIN/SUPERVISOR see all shops.
// SALESMAN sees only shops they have personally placed at least one order from.
const getAllShops = async (requestingUser) => {
  if (requestingUser.role === ROLES.SALESMAN) {
    return shopsRepository.findShopsOrderedBySalesman(requestingUser.userId);
  }
  return shopsRepository.findAllShops();
};

// ─── Get One Shop ─────────────────────────────────────────────────────────────
const getShopById = async (id, requestingUser) => {
  const shop = await shopsRepository.findShopById(id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  // All roles can view any shop
  return shop;
};

// ─── Create Shop ──────────────────────────────────────────────────────────────
const createShop = async (shopData) => {
  const shop = await shopsRepository.createShop({
    shopName:   shopData.shopName,
    ownerName:  shopData.ownerName  || null,
    phone:      shopData.phone      || null,
    address:    shopData.address    || null,
    salesmanId: shopData.salesmanId || null,
    isVerified: true, // Default to verified for new shops
  });
  // Return shop with salesman relation
  return shopsRepository.findShopById(shop.id);
};

// ─── Update Shop ──────────────────────────────────────────────────────────────
const updateShop = async (id, updateData) => {
  const existing = await shopsRepository.findShopById(id);

  if (!existing) {
    throw new AppError('Shop not found', 404);
  }

  await shopsRepository.updateShop(id, updateData);
  // Return shop with salesman relation
  return shopsRepository.findShopById(id);
};

// ─── Add Alias ────────────────────────────────────────────────────────────────
const addAlias = async (shopId, alias) => {
  const shop = await shopsRepository.findShopById(shopId);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  return shopsRepository.createAlias({ shopId, alias });
};

// ─── Delete Shop ────────────────────────────────────────────────────────────────
const deleteShop = async (id) => {
  const existing = await shopsRepository.findShopById(id);

  if (!existing) {
    throw new AppError('Shop not found', 404);
  }

  await shopsRepository.deleteShop(id);
  return { message: 'Shop deleted successfully' };
};

module.exports = { getAllShops, getShopById, createShop, updateShop, addAlias, deleteShop };
