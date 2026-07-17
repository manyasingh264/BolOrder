// products.service.js — business logic for products, variants, and aliases.
//
// Rules enforced here:
//   - A product must exist before adding a variant or alias to it
//   - A variant must belong to the correct product before updating
//   - Deactivating a product is a soft delete (isActive = false), not a hard delete
//   - Hard deletes are intentionally NOT supported — orders reference product variants
//     and we must preserve that data integrity

const productsRepository = require('./products.repository');
const AppError = require('../../utils/AppError');

// ─── Products ──────────────────────────────────────────────────────────────────

const getAllProducts = async () => {
  return productsRepository.findAllProducts();
};

const getProductById = async (id) => {
  const product = await productsRepository.findProductById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

const createProduct = async (productData) => {
  // Create the product first
  const product = await productsRepository.createProduct({
    name:        productData.name,
    category:    productData.category    || null,
    description: productData.description || null,
    isActive:    true,
  });

  // If variants are provided, create them
  if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
    for (const variant of productData.variants) {
      // Convert price from string to number for database
      const priceValue = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
      await productsRepository.createVariant({
        productId: product.id,
        size:      variant.size  || null,
        unit:      variant.unit,
        sku:       variant.sku   || null,
        price:     priceValue,
      });
    }
  }

  // Return the product with its variants
  return productsRepository.findProductById(product.id);
};

const updateProduct = async (id, updateData) => {
  const existing = await productsRepository.findProductById(id);

  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  // Update product fields, use isActive from request if provided, otherwise preserve existing
  const product = await productsRepository.updateProduct(id, {
    name: updateData.name,
    category: updateData.category,
    description: updateData.description,
    isActive: updateData.isActive !== undefined ? updateData.isActive : existing.isActive,
  });

  // Handle variants if provided
  if (updateData.variants && Array.isArray(updateData.variants)) {
    // Delete all existing variants for this product
    await productsRepository.deleteVariantsByProductId(id);

    // Create new variants from the update data
    for (const variant of updateData.variants) {
      const priceValue = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
      await productsRepository.createVariant({
        productId: id,
        size: variant.size || null,
        unit: variant.unit,
        sku: variant.sku || null,
        price: priceValue,
      });
    }
  }

  // Return the updated product with variants
  return productsRepository.findProductById(id);
};

const deleteProduct = async (id) => {
  const existing = await productsRepository.findProductById(id);

  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete - just set isActive to false
  return productsRepository.updateProduct(id, { isActive: false });
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const addVariant = async (productId, variantData) => {
  // Rule: product must exist before adding a variant
  const product = await productsRepository.findProductById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return productsRepository.createVariant({
    productId:   productId,
    size:        variantData.size  || null,
    unit:        variantData.unit,
    sku:         variantData.sku   || null,
    price:       variantData.price,
  });
};

const updateVariant = async (productId, variantId, updateData) => {
  // Rule: Verify the variant exists AND belongs to this product
  const variant = await productsRepository.findVariantById(variantId);

  if (!variant) {
    throw new AppError('Variant not found', 404);
  }

  if (variant.productId !== productId) {
    throw new AppError('This variant does not belong to the specified product', 400);
  }

  return productsRepository.updateVariant(variantId, updateData);
};

// ─── Aliases ──────────────────────────────────────────────────────────────────

const addAlias = async (productId, alias) => {
  // Rule: product must exist before adding an alias
  const product = await productsRepository.findProductById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return productsRepository.createAlias({
    productId: productId,
    alias:     alias,
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  addAlias,
};
