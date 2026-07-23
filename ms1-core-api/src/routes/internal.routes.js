// internal.routes.js — routes exclusively for MS2 (AI Service) internal calls.
//
// Mounted at /api/internal in routes/index.js
// ALL routes protected by internalAuth (X-Service-Key header).
// Frontend never reaches these routes.

const { Router } = require('express');
const internalAuth       = require('../middleware/internalAuth.middleware');
const internalController = require('../modules/internal/internal.controller');

const router = Router();

// All internal routes require MS2 service key
router.use(internalAuth);

// GET /api/internal/context?salesman_id=<uuid>
// MS2 loads shops + products for a session's business context cache
router.get('/context', internalController.getContext);

// POST /api/internal/orders
// MS2 creates order after AI conversation is confirmed by salesman
router.post('/orders', internalController.createOrder);

// POST /api/internal/shops
// MS2 creates a new unverified shop discovered during conversation
router.post('/shops', internalController.createShop);

module.exports = router;
