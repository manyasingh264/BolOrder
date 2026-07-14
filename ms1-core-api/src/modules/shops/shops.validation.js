// shops.validation.js — Zod schemas for the Shops module.

const { z } = require('zod');

// ─── Create Shop ───────────────────────────────────────────────────────────────
const createShopSchema = z.object({
  shopName: z
    .string({ required_error: 'Shop name is required' })
    .min(2, 'Shop name must be at least 2 characters'),

  ownerName:  z.string().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),

  // UUID of the salesman assigned to this shop (optional — can be assigned later)
  salesmanId: z
    .string()
    .uuid('salesmanId must be a valid UUID')
    .optional()
    .nullable(),
});

// ─── Update Shop ───────────────────────────────────────────────────────────────
const updateShopSchema = z.object({
  shopName:   z.string().min(2).optional(),
  ownerName:  z.string().optional(),
  phone:      z.string().optional(),
  address:    z.string().optional(),
  salesmanId: z.string().uuid('salesmanId must be a valid UUID').optional().nullable(),
});

// ─── Shop Alias ────────────────────────────────────────────────────────────────
// Aliases are alternate names used in speech (e.g. "Sharma ki dukaan")
const addAliasSchema = z.object({
  alias: z
    .string({ required_error: 'Alias is required' })
    .min(1, 'Alias cannot be empty'),
});

module.exports = { createShopSchema, updateShopSchema, addAliasSchema };
