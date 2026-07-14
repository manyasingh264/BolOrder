// orders.controller.js — handles HTTP requests for the orders module.

const fs = require('fs');

const ordersService = require('./orders.service');
const aiService     = require('../../services/ai.service');
const sendResponse  = require('../../utils/sendResponse');
const AppError      = require('../../utils/AppError');

// GET /api/orders
const getAll = async (req, res, next) => {
  try {
    const orders = await ordersService.getAllOrders(req.user);
    return sendResponse(res, 200, true, 'Orders retrieved successfully', orders);
  } catch (error) { next(error); }
};

// GET /api/orders/:id
const getOne = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id, req.user);
    return sendResponse(res, 200, true, 'Order retrieved successfully', order);
  } catch (error) { next(error); }
};

// POST /api/orders
const create = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user);
    return sendResponse(res, 201, true, 'Order created successfully', order);
  } catch (error) { next(error); }
};

// POST /api/orders/:id/items
const addItem = async (req, res, next) => {
  try {
    const item = await ordersService.addItem(req.params.id, req.body, req.user);
    return sendResponse(res, 201, true, 'Item added to order', item);
  } catch (error) { next(error); }
};

// DELETE /api/orders/:id/items/:itemId
const removeItem = async (req, res, next) => {
  try {
    const result = await ordersService.removeItem(req.params.id, req.params.itemId, req.user);
    return sendResponse(res, 200, true, result.message, null);
  } catch (error) { next(error); }
};

// PATCH /api/orders/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const order = await ordersService.updateStatus(
      req.params.id,
      req.body.status,
      req.body.remarks,
      req.user
    );
    return sendResponse(res, 200, true, 'Order status updated', order);
  } catch (error) { next(error); }
};

// ─── POST /api/orders/voice ───────────────────────────────────────────────────
// Full FastAPI-integrated voice order flow:
//
//   1. uploadAudio middleware (in routes.js) saves audio to uploads/audio/
//   2. authenticate middleware verifies the salesman's JWT
//   3. THIS handler:
//      a. Sends audio file to FastAPI AI microservice
//      b. Gets back: { shopId, rawTranscript, items[], confidence }
//      c. Creates the voice order in DB via ordersService.createVoiceOrder()
//      d. Deletes the temp audio file (in finally — always runs)
//      e. Returns the created order
//
// Input:  multipart/form-data  { audio: <file> }
// Output: 201 with full order object
//
const createVoiceOrder = async (req, res, next) => {
  const audioFile = req.file; // set by multer (upload.middleware.js)

  try {
    // Guard: multer must have saved a file (shouldn't happen in practice — routes.js enforces it)
    if (!audioFile) {
      throw new AppError('Audio file is required. Send a multipart/form-data request with field name "audio".', 400);
    }

    // ─── Step 1: Send audio to FastAPI ──────────────────────────────────────
    // aiService handles: timeout, ECONNREFUSED, 4xx/5xx, response shape validation
    const aiResult = await aiService.processAudioOrder(audioFile.path);

    // ─── Step 2: Create voice order in database ──────────────────────────────
    // ordersService.createVoiceOrder expects: { shopId, rawTranscript, items[] }
    // It creates the order at PENDING_CONFIRMATION status with a status history row.
    const order = await ordersService.createVoiceOrder(
      {
        shopId:        aiResult.shopId,
        rawTranscript: aiResult.rawTranscript || null,
        items:         aiResult.items,   // [{ productVariantId, quantity }]
      },
      req.user
    );

    return sendResponse(res, 201, true, 'Voice order created successfully', {
      order,
      aiMeta: {
        confidence: aiResult.confidence || null,
        shopName:   aiResult.shopName   || null,
      },
    });

  } catch (error) {
    next(error);
  } finally {
    // ─── Step 3: Cleanup temp audio file ────────────────────────────────────
    // Runs regardless of success or failure — we never leave orphaned audio on disk.
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
  }
};

module.exports = { getAll, getOne, create, addItem, removeItem, updateStatus, createVoiceOrder };
