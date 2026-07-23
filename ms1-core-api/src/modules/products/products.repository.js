// products.repository.js — all Drizzle queries for products, variants, and aliases.
//
// Uses Drizzle's relational query API (db.query.*) for fetching nested data.
// This is cleaner than writing manual JOINs for one-to-many relationships.
//
// Key design decisions:
//   - findAllProducts  → includes variants (for price display in order forms)
//   - findProductById  → includes variants AND aliases (full detail view)
//   - Aliases are for the AI fuzzy matching — not shown in list view

const { eq } = require('drizzle-orm');
const { db } = require('../../database/db');
const { products, productVariants, productAliases } = require('../../database/schema');

// Get all products with their variants
// Used by: salesman order form, product list page
const findAllProducts = async () => {
  return db.query.products.findMany({
    where: (products, { eq }) => eq(products.isActive, true),
    with: {
      variants: true,
    },
    orderBy: (products, { asc }) => [asc(products.name)],
  });
};

// Get all products with their variants AND aliases
// Used by: MS2 internal context API — AI needs aliases for fuzzy name matching
const findAllProductsWithAliases = async () => {
  return db.query.products.findMany({
    where: (products, { eq }) => eq(products.isActive, true),
    with: {
      variants: true,
      aliases:  true,
    },
    orderBy: (products, { asc }) => [asc(products.name)],
  });
};


// Get one product with its variants AND aliases
// Used by: product detail page, admin editing
const findProductById = async (id) => {
  return db.query.products.findFirst({
    where: (products, { eq }) => eq(products.id, id),
    with: {
      variants: true,
      aliases:  true,
    },
  });
};

// Insert a new product and return it
const createProduct = async (productData) => {
  const result = await db
    .insert(products)
    .values(productData)
    .returning();

  return result[0];
};

// Update a product by ID and return the updated record
const updateProduct = async (id, updateData) => {
  const result = await db
    .update(products)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return result[0] || null;
};

// Get one variant by its ID (used to verify variant belongs to the right product)
const findVariantById = async (id) => {
  const result = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);

  return result[0] || null;
};

// Add a new variant to a product
const createVariant = async (variantData) => {
  const result = await db
    .insert(productVariants)
    .values(variantData)
    .returning();

  return result[0];
};

// Delete all variants for a product
const deleteVariantsByProductId = async (productId) => {
  await db
    .delete(productVariants)
    .where(eq(productVariants.productId, productId));
};

// Update a variant by ID
const updateVariant = async (id, updateData) => {
  const result = await db
    .update(productVariants)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(productVariants.id, id))
    .returning();

  return result[0] || null;
};

// Add an alias to a product
const createAlias = async (aliasData) => {
  const result = await db
    .insert(productAliases)
    .values(aliasData)
    .returning();

  return result[0];
};

module.exports = {
  findAllProducts,
  findAllProductsWithAliases,
  findProductById,
  createProduct,
  updateProduct,
  findVariantById,
  createVariant,
  deleteVariantsByProductId,
  updateVariant,
  createAlias,
};
