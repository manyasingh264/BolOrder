// orders.routes.js — route definitions for the orders module.
//
// Mounted at /api/orders in routes/index.js
//
// Access rules:
//   GET  /api/orders           → ALL roles (salesman filtered in service)
//   GET  /api/orders/:id       → ALL roles (salesman access-checked in service)
//   POST /api/orders           → ALL roles (salesman creates for themselves)
//   POST /api/orders/voice     → ALL roles (salesman submits voice order)
//   POST /api/orders/:id/items → ALL roles (salesman adds items to own draft)
//   DELETE /api/orders/:id/items/:itemId → ALL roles (salesman removes from own draft)
//   PATCH /api/orders/:id/status → ADMIN + SUPERVISOR only

const { Router } = require('express');

const ordersController = require('./orders.controller');
const {
  createOrderSchema,
  addItemSchema,
  updateStatusSchema,
} = require('./orders.validation');
const authenticate    = require('../../middleware/authenticate.middleware');
const authorize       = require('../../middleware/authorize.middleware');
const validateRequest = require('../../middleware/validateRequest.middleware');
const uploadAudio     = require('../../middleware/upload.middleware');
const { ROLES }       = require('../../constants');

const router = Router();

// All order routes require a valid JWT
router.use(authenticate);

// ─── Voice Order ─────────────────────────────────────────────────────────────
// IMPORTANT: /voice must be defined BEFORE /:id to avoid Express treating "voice"
// as an ID parameter. Route order matters in Express.
//
// Middleware chain:
//   uploadAudio  → multer saves audio to uploads/audio/, validates type & size
//   controller   → sends audio to FastAPI, creates order in DB, deletes audio file
//
// Request format: multipart/form-data with field name "audio" (audio file)
router.post(
  '/voice',
  uploadAudio,
  ordersController.createVoiceOrder
);

// ─── Main Order Routes ────────────────────────────────────────────────────────
router.get('/',    ordersController.getAll);
router.get('/:id', ordersController.getOne);

router.post(
  '/',
  validateRequest(createOrderSchema),
  ordersController.create
);

// ─── Item Sub-Routes (all roles — service checks ownership) ──────────────────
router.post(
  '/:id/items',
  validateRequest(addItemSchema),
  ordersController.addItem
);

router.delete('/:id/items/:itemId', ordersController.removeItem);

// ─── Status Update (ADMIN + SUPERVISOR only) ──────────────────────────────────
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  validateRequest(updateStatusSchema),
  ordersController.updateStatus
);

// ─── Delete Order (all roles — service checks ownership & DRAFT status) ────────
router.delete('/:id', ordersController.remove);

module.exports = router;
