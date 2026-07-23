// internal.controller.js — Handles internal API calls from MS2 (AI Service).
//
// These endpoints are ONLY for MS2. Never expose to frontend.
// Protected by X-Service-Key header via internalAuth middleware.
//
// Endpoints:
//   GET  /api/internal/context        — Return shops + products for a salesman session
//   POST /api/internal/orders         — Create a voice order after AI conversation
//   POST /api/internal/shops          — Create a new unverified shop discovered by AI

const shopsRepository    = require('../shops/shops.repository');
const productsRepository = require('../products/products.repository');
const ordersService      = require('../orders/orders.service');
const sendResponse       = require('../../utils/sendResponse');
const AppError           = require('../../utils/AppError');

// ─── GET /api/internal/context ────────────────────────────────────────────────
// Returns shops + products for the MS2 session business context cache.
// MS2 calls this once per session on first audio turn.
//
// Query params:
//   salesman_id — UUID of the salesman (from the JWT decoded in MS1 voice proxy)
//
// Returns:
//   { shops: [...], products: [...] }
const getContext = async (req, res, next) => {
  try {
    const { salesman_id } = req.query;

    // Load all active shops (salesmen can order from any shop)
    const shops = await shopsRepository.findAllShops();

    // Load all active products with their variants and aliases
    const productsRaw = await productsRepository.findAllProductsWithAliases();

    return sendResponse(res, 200, true, 'Business context loaded', {
      shops,
      products: productsRaw,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/internal/orders ────────────────────────────────────────────────
// Creates a voice order after the AI conversation is confirmed.
// Called by MS2 when the salesman confirms the draft order.
//
// Body:
//   { shopId, salesmanId, items: [{productVariantId, quantity}], rawTranscript? }
//
// Returns: the created order
const createOrder = async (req, res, next) => {
  try {
    const { shopId, salesmanId, items, rawTranscript } = req.body;

    if (!shopId || !salesmanId) {
      throw new AppError('shopId and salesmanId are required.', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('items array is required and must not be empty.', 400);
    }

    // Build a minimal requestingUser from the salesmanId provided by MS2
    // MS2 got this from the JWT decoded by MS1 when it proxied the original request
    const requestingUser = { userId: salesmanId, role: 'SALESMAN' };

    const order = await ordersService.createVoiceOrder(
      { shopId, items, rawTranscript: rawTranscript || null },
      requestingUser
    );

    return sendResponse(res, 201, true, 'Voice order created', order);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/internal/shops ────────────────────────────────────────────────
// Creates a new unverified shop discovered by the AI during conversation.
// The shop starts with isVerified=false — a manager must verify it later.
//
// Body:
//   { shopName, salesmanId, ownerName?, phone?, address? }
//
// Returns: the created shop
const createShop = async (req, res, next) => {
  try {
    const { shopName, salesmanId, ownerName, phone, address } = req.body;

    if (!shopName || !salesmanId) {
      throw new AppError('shopName and salesmanId are required.', 400);
    }

    const shop = await shopsRepository.createShop({
      shopName,
      salesmanId,
      ownerName:  ownerName  || null,
      phone:      phone      || null,
      address:    address    || null,
      isVerified: false,  // New shops discovered via voice start unverified
      isActive:   true,
    });

    return sendResponse(res, 201, true, 'Shop created (pending verification)', shop);
  } catch (error) {
    next(error);
  }
};

module.exports = { getContext, createOrder, createShop };
