// shops.service.js — business logic for customer shops.
//
// Role-based data access rules enforced here:
//   ADMIN     → can see all shops, create, update, add aliases
//   SUPERVISOR → can see all shops, create, update, add aliases
//   SALESMAN   → can ONLY see their own assigned shops (READ ONLY)
//
// These rules are enforced by checking req.user.role (passed in as requestingUser).

const shopsRepository = require('./shops.repository');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants');

// ─── Get All Shops ────────────────────────────────────────────────────────────
// SALESMAN sees only their shops; ADMIN/SUPERVISOR see all
const getAllShops = async (requestingUser) => {
  if (requestingUser.role === ROLES.SALESMAN) {
    return shopsRepository.findShopsBySalesmanId(requestingUser.userId);
  }

  return shopsRepository.findAllShops();
};

// ─── Get One Shop ─────────────────────────────────────────────────────────────
const getShopById = async (id, requestingUser) => {
  const shop = await shopsRepository.findShopById(id);

  if (!shop) {
    throw new AppError('Shop not found', 404);
  }

  // SALESMAN can only view shops assigned to them
  if (
    requestingUser.role === ROLES.SALESMAN &&
    shop.salesmanId !== requestingUser.userId
  ) {
    throw new AppError('You do not have access to this shop', 403);
  }

  return shop;
};

// ─── Create Shop ──────────────────────────────────────────────────────────────
const createShop = async (shopData) => {
  return shopsRepository.createShop({
    shopName:   shopData.shopName,
    ownerName:  shopData.ownerName  || null,
    phone:      shopData.phone      || null,
    address:    shopData.address    || null,
    salesmanId: shopData.salesmanId || null,
    isVerified: true, // Default to verified for new shops
  });
};

// ─── Update Shop ──────────────────────────────────────────────────────────────
const updateShop = async (id, updateData) => {
  const existing = await shopsRepository.findShopById(id);

  if (!existing) {
    throw new AppError('Shop not found', 404);
  }

  return shopsRepository.updateShop(id, updateData);
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
