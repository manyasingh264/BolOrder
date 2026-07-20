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

// ─── Sentry (MUST be initialized before anything else) ───────────────────────
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { randomUUID } = require('crypto');

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

// ─── Request ID ───────────────────────────────────────────────────────────────
// Attaches a unique ID to every request (or reuses one passed in from upstream,
// e.g. from ms2 or nginx). Sent back in the response so it can be traced across
// services and matched against logs on both ms1 and ms2.
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ─── Structured Request Logging ───────────────────────────────────────────────
// Logs one JSON line per request: id, method, url, status, duration_ms, timestamp.
// Machine-parseable — ready to ship to CloudWatch or any log aggregator later.
morgan.token('id', (req) => req.requestId);


app.use(morgan((tokens, req, res) => {
  return JSON.stringify({
    id: tokens.id(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    duration_ms: Number(tokens['response-time'](req, res)),
    timestamp: new Date().toISOString(),
  });
}));

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

// ─── Sentry Error Handler ──────────────────────────────────────────────────────
// Must be registered AFTER routes/404, but BEFORE your own error handler,
// so Sentry captures the error before your custom handler formats the response.
Sentry.setupExpressErrorHandler(app);

// ─── Centralized Error Handler ────────────────────────────────────────────────
// MUST be registered last. Express identifies error handlers by the 4-parameter
// signature (err, req, res, next). All next(err) calls land here.
app.use(errorHandler);

module.exports = app;