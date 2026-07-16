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
// Two modes:
//
//   MODE 1 — JSON body (called by MS2 after AI conversation):
//     Input:  application/json { shopId, items[], rawTranscript? }
//     Output: 201 order at PENDING_CONFIRMATION status
//
//   MODE 2 — Audio file (legacy direct-upload flow):
//     Input:  multipart/form-data { audio: <file> }
//     Output: audio forwarded to FastAPI → order created
//
const createVoiceOrder = async (req, res, next) => {
  const audioFile = req.file;

  try {
    // ─── MODE 1: JSON body from MS2 ──────────────────────────────
    if (!audioFile) {
      const { shopId, items, rawTranscript } = req.body;

      if (!shopId || !Array.isArray(items) || items.length === 0) {
        throw new AppError(
          'JSON voice order requires: shopId (string) and items (array). ' +
          'Or send an audio file as multipart/form-data with field name "audio".',
          400
        );
      }

      const order = await ordersService.createVoiceOrder(
        { shopId, rawTranscript: rawTranscript || null, items },
        req.user
      );
      return sendResponse(res, 201, true, 'Voice order created successfully', { order, aiMeta: null });
    }

    // ─── MODE 2: Audio file → FastAPI ────────────────────────────
    const aiResult = await aiService.processAudioOrder(audioFile.path);
    const order = await ordersService.createVoiceOrder(
      {
        shopId:        aiResult.shopId,
        rawTranscript: aiResult.rawTranscript || null,
        items:         aiResult.items,
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
    // Always clean up temp audio file (Mode 2 only)
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
  }
};

module.exports = { getAll, getOne, create, addItem, removeItem, updateStatus, createVoiceOrder };
