// products.routes.js — route definitions for the products module.
//
// Mounted at /api/products in routes/index.js
//
// Access rules:
//   READ  (GET)   → ALL authenticated users (ADMIN, SUPERVISOR, SALESMAN)
//                   Salesmen need product list + variants to build orders
//   WRITE (POST, PATCH) → ADMIN only
//                   Only admin manages the product catalog

const { Router } = require('express');

const productsController = require('./products.controller');
const {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  addAliasSchema,
} = require('./products.validation');
const authenticate  = require('../../middleware/authenticate.middleware');
const authorize     = require('../../middleware/authorize.middleware');
const validateRequest = require('../../middleware/validateRequest.middleware');
const { ROLES } = require('../../constants');

const router = Router();

// All routes require a valid JWT
router.use(authenticate);

// ─── Product Routes ───────────────────────────────────────────────────────────

// GET  /api/products      → all users (salesman needs product list for orders)
router.get('/', productsController.getAll);

// GET  /api/products/:id  → all users
router.get('/:id', productsController.getOne);

// POST /api/products      → ADMIN only
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validateRequest(createProductSchema),
  productsController.create
);

// PATCH /api/products/:id → ADMIN only
router.patch(
  '/:id',
  authorize(ROLES.ADMIN),
  validateRequest(updateProductSchema),
  productsController.update
);

// ─── Variant Sub-Routes ───────────────────────────────────────────────────────

// POST  /api/products/:id/variants             → ADMIN only
router.post(
  '/:id/variants',
  authorize(ROLES.ADMIN),
  validateRequest(createVariantSchema),
  productsController.addVariant
);

// PATCH /api/products/:id/variants/:variantId  → ADMIN only
router.patch(
  '/:id/variants/:variantId',
  authorize(ROLES.ADMIN),
  validateRequest(updateVariantSchema),
  productsController.updateVariant
);

// ─── Alias Sub-Routes ─────────────────────────────────────────────────────────

// POST /api/products/:id/aliases               → ADMIN only
router.post(
  '/:id/aliases',
  authorize(ROLES.ADMIN),
  validateRequest(addAliasSchema),
  productsController.addAlias
);

module.exports = router;
