// orders.validation.js — Zod schemas for the Orders module.

const { z } = require('zod');
const { ORDER_STATUSES } = require('../../constants');

// ─── Single order item (used inside createOrderSchema and voiceOrderSchema) ────
const orderItemSchema = z.object({
  productVariantId: z
    .string({ required_error: 'productVariantId is required' })
    .uuid('productVariantId must be a valid UUID'),

  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1'),
});

// ─── Create Order (manual) ─────────────────────────────────────────────────────
// Admin/Supervisor can specify salesmanId to place order on behalf of a salesman.
// Salesman's salesmanId is auto-set from their JWT in the service.
const createOrderSchema = z.object({
  shopId: z
    .string({ required_error: 'shopId is required' })
    .uuid('shopId must be a valid UUID'),

  salesmanId: z
    .string()
    .uuid('salesmanId must be a valid UUID')
    .optional(),

  // Items are optional on create — order starts as DRAFT, items added later
  items: z.array(orderItemSchema).optional().default([]),
});

// ─── Add Single Item to an Existing DRAFT Order ───────────────────────────────
const addItemSchema = z.object({
  productVariantId: z
    .string({ required_error: 'productVariantId is required' })
    .uuid('productVariantId must be a valid UUID'),

  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1'),
});

// ─── Update Order Status ───────────────────────────────────────────────────────
// Terminal statuses (DRAFT, DELIVERED, CANCELLED) are excluded — DRAFT is default,
// and you can't transition INTO DRAFT or DELIVERED/CANCELLED as a target from all states.
// Allowed targets are validated dynamically by VALID_STATUS_TRANSITIONS in the service.
const updateStatusSchema = z.object({
  status: z.enum(
    [
      ORDER_STATUSES.PENDING_CONFIRMATION,
      ORDER_STATUSES.CONFIRMED,
      ORDER_STATUSES.DISPATCHED,
      ORDER_STATUSES.DELIVERED,
      ORDER_STATUSES.CANCELLED,
    ],
    { required_error: 'Status is required' }
  ),

  remarks: z.string().optional(), // optional note for status change (e.g. "Confirmed by Priya")
});

// ─── Voice Order (from AI microservice result) ────────────────────────────────
// The AI extracts shopId + line items from the audio transcript.
// This schema validates what comes back from FastAPI before we create the order.
const voiceOrderSchema = z.object({
  shopId: z
    .string({ required_error: 'shopId is required' })
    .uuid('shopId must be a valid UUID'),

  rawTranscript: z.string().optional(), // the original speech-to-text output

  items: z
    .array(orderItemSchema)
    .min(1, 'Voice order must contain at least one item'),
});

module.exports = {
  createOrderSchema,
  addItemSchema,
  updateStatusSchema,
  voiceOrderSchema,
};
