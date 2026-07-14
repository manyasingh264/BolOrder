// routes/index.js — the central route registry.
//
// app.js imports ONLY this file. This file mounts every module's router.
// When a new module is added, we add exactly ONE line here.
//
// All API routes are prefixed with /api (set in app.js).
// So routes here get full paths like /api/health, /api/auth/login, etc.

const { Router } = require('express');

const router = Router();

// ─── Health Check ─────────────────────────────────────────────────────────────
// Lets the frontend, DevOps, and future load balancers verify the server is alive.
// No auth required — this is intentionally public.
router.get('/health', (req, res) => {
  res.json({
    success:   true,
    message:   'ms1-core-api is running',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/ai — checks if the FastAPI AI microservice is reachable.
// Frontend calls this before showing the "Record Voice Order" button.
// If offline → frontend disables recording and shows "AI service unavailable".
router.get('/health/ai', async (req, res) => {
  const aiService = require('../services/ai.service');
  const result    = await aiService.checkFastApiHealth();
  res.status(result.online ? 200 : 503).json({
    success:   result.online,
    message:   result.online ? 'AI service is online' : 'AI service is offline',
    aiService: result.status,
    timestamp: new Date().toISOString(),
  });
});


// ─── Module Routes ────────────────────────────────────────────────────────────
// Uncommented one by one as each step is completed.

// Step 5  — Auth Module ✅
router.use('/auth', require('../modules/auth/auth.routes'));

// Step 6  — Users Module ✅
router.use('/users', require('../modules/users/users.routes'));

// Step 7  — Products Module ✅
router.use('/products', require('../modules/products/products.routes'));

// Step 8  — Shops Module ✅
router.use('/shops', require('../modules/shops/shops.routes'));

// Step 9  — Orders Module ✅
router.use('/orders', require('../modules/orders/orders.routes'));

// Step 10 — Dashboard Module ✅
router.use('/dashboard', require('../modules/dashboard/dashboard.routes'));

module.exports = router;
