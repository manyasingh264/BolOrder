// app.js — creates and configures the Express application.
//
// This file is responsible for:
//   1. Applying global middleware (runs on EVERY request)
//   2. Mounting all API routes under /api
//   3. Handling 404s for unknown routes
//   4. Registering the centralized error handler
//
// It does NOT start the server (that's server.js's job).
// It exports `app` so server.js can call app.listen().

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// Parse incoming requests with JSON bodies (e.g. POST /api/auth/login)
app.use(express.json());

// Parse URL-encoded bodies (e.g. HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// Allow cross-origin requests from the React frontend
// In production, replace with: cors({ origin: 'https://your-frontend-domain.com' })
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// HTTP request logger — logs method, URL, status code, and response time
// 'dev' format: GET /api/health 200 2.456 ms
app.use(morgan('dev'));

// ─── API Routes ───────────────────────────────────────────────────────────────
// All routes are namespaced under /api
// e.g. /api/health, /api/auth/login, /api/orders
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
// If a request reaches here, no route matched it.
// Return clean JSON instead of Express's default HTML error page.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
// MUST be registered last. Express identifies error handlers by the 4-parameter
// signature (err, req, res, next). All next(err) calls land here.
app.use(errorHandler);

module.exports = app;
