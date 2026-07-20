// products.validation.js — Zod schemas for the Products module.

const { z } = require('zod');

// ─── Product ───────────────────────────────────────────────────────────────────
const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(2, 'Name must be at least 2 characters'),

  category:    z.string().optional(),
  description: z.string().optional(),
  variants: z.array(z.object({
    size: z.string().regex(/^\d*\.?\d*$/, 'Size must be a number').optional(),
    unit: z.string().min(1, 'Unit is required'),
    sku: z.string().regex(/^[a-zA-Z0-9-_]*$/, 'SKU must be alphanumeric').optional(),
    price: z.number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' }).positive('Price must be greater than 0'),
  })).min(1, 'At least one variant is required'),
});

const updateProductSchema = z.object({
  name:        z.string().min(2).optional(),
  category:    z.string().optional(),
  description: z.string().optional(),
  isActive:    z.boolean().optional(),
});

// ─── Product Variant ──────────────────────────────────────────────────────────
// A variant is a specific size/unit combination with its own price.
// Example: Aloo Bhujia → 200g packet @ ₹30, 500g packet @ ₹70, 1kg packet @ ₹130

const createVariantSchema = z.object({
  size: z.string().optional(),  // e.g. "200g", "500g", "1kg"
  unit: z
    .string({ required_error: 'Unit is required' })
    .min(1, 'Unit cannot be empty'),  // e.g. "packet", "box", "kg"

  sku: z.string().optional(),   // e.g. "ALB-200G"

  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
});

const updateVariantSchema = z.object({
  size:  z.string().optional(),
  unit:  z.string().min(1).optional(),
  sku:   z.string().optional(),
  price: z.number().positive().optional(),
});

// ─── Product Alias ────────────────────────────────────────────────────────────
// Aliases are alternate names used in speech (Hindi/Hinglish)
// e.g. "bhujiya", "aloo wala", "namkeen"
const addAliasSchema = z.object({
  alias: z
    .string({ required_error: 'Alias is required' })
    .min(1, 'Alias cannot be empty'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  addAliasSchema,
};
