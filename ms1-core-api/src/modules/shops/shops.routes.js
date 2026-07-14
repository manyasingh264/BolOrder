// shops.routes.js — route definitions for the shops module.
//
// Mounted at /api/shops in routes/index.js
//
// Access rules:
//   GET  /api/shops         → ALL roles (salesman filtered in service)
//   GET  /api/shops/:id     → ALL roles (salesman access-checked in service)
//   POST /api/shops         → ADMIN, SUPERVISOR only
//   PATCH /api/shops/:id    → ADMIN, SUPERVISOR only
//   POST /api/shops/:id/aliases → ADMIN, SUPERVISOR only

const { Router } = require('express');

const shopsController = require('./shops.controller');
const { createShopSchema, updateShopSchema, addAliasSchema } = require('./shops.validation');
const authenticate   = require('../../middleware/authenticate.middleware');
const authorize      = require('../../middleware/authorize.middleware');
const validateRequest = require('../../middleware/validateRequest.middleware');
const { ROLES } = require('../../constants');

const router = Router();

// All shop routes require a valid JWT
router.use(authenticate);

// ─── Read Routes (all authenticated roles) ────────────────────────────────────
router.get('/',    shopsController.getAll);
router.get('/:id', shopsController.getOne);

// ─── Write Routes (ADMIN and SUPERVISOR only) ─────────────────────────────────
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  validateRequest(createShopSchema),
  shopsController.create
);

router.patch(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  validateRequest(updateShopSchema),
  shopsController.update
);

router.post(
  '/:id/aliases',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  validateRequest(addAliasSchema),
  shopsController.addAlias
);

module.exports = router;
