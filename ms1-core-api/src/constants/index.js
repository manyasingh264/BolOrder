// App-wide named constants.
// Using constants instead of magic strings prevents typos and makes refactoring safe.

const ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SALESMAN: 'SALESMAN',
};

const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

module.exports = { ROLES, ORDER_STATUS };
