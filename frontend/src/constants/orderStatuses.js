// constants/orderStatuses.js — mirrors backend ORDER_STATUSES + VALID_STATUS_TRANSITIONS

export const ORDER_STATUSES = {
  DRAFT:                'DRAFT',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED:            'CONFIRMED',
  DISPATCHED:           'DISPATCHED',
  DELIVERED:            'DELIVERED',
  CANCELLED:            'CANCELLED',
};

// Human-readable labels for display
export const ORDER_STATUS_LABELS = {
  DRAFT:                'Draft',
  PENDING_CONFIRMATION: 'Pending Confirmation',
  CONFIRMED:            'Confirmed',
  DISPATCHED:           'Dispatched',
  DELIVERED:            'Delivered',
  CANCELLED:            'Cancelled',
};

// State machine — matches backend VALID_STATUS_TRANSITIONS exactly
export const VALID_STATUS_TRANSITIONS = {
  DRAFT:                ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED',            'CANCELLED'],
  CONFIRMED:            ['DISPATCHED',            'CANCELLED'],
  DISPATCHED:           ['DELIVERED',             'CANCELLED'],
  DELIVERED:            [], // terminal
  CANCELLED:            [], // terminal
};

// Tailwind CSS classes for each status — used by Badge component
export const ORDER_STATUS_STYLES = {
  DRAFT:                'badge-draft',
  PENDING_CONFIRMATION: 'badge-pending',
  CONFIRMED:            'badge-confirmed',
  DISPATCHED:           'badge-dispatched',
  DELIVERED:            'badge-delivered',
  CANCELLED:            'badge-cancelled',
};
