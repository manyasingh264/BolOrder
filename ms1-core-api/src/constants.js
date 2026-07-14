// constants.js — application-wide constants.
//
// Centralising string literals here prevents typos across modules.
// Always import from this file instead of writing role/status strings directly.

// ─── User Roles ────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN:      'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SALESMAN:   'SALESMAN',
};

// ─── Order Statuses ────────────────────────────────────────────────────────────
const ORDER_STATUSES = {
  DRAFT:                'DRAFT',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED:            'CONFIRMED',
  DISPATCHED:           'DISPATCHED',
  DELIVERED:            'DELIVERED',
  CANCELLED:            'CANCELLED',
};

// ─── Status Transition Map ─────────────────────────────────────────────────────
// Defines which statuses an order is allowed to move INTO from each current status.
// Used by orders.service.js to validate PATCH /api/orders/:id/status requests.
const VALID_STATUS_TRANSITIONS = {
  [ORDER_STATUSES.DRAFT]:                [ORDER_STATUSES.PENDING_CONFIRMATION, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PENDING_CONFIRMATION]: [ORDER_STATUSES.CONFIRMED,            ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]:            [ORDER_STATUSES.DISPATCHED,            ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DISPATCHED]:           [ORDER_STATUSES.DELIVERED,             ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]:            [], // terminal state — no further transitions
  [ORDER_STATUSES.CANCELLED]:            [], // terminal state — no further transitions
};

module.exports = { ROLES, ORDER_STATUSES, VALID_STATUS_TRANSITIONS };
