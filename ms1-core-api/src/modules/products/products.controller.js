// products.controller.js — handles HTTP requests for the products module.
//
// Responsibility: Read from req, call service, send response.
//                 No business logic. No direct DB access.

const productsService = require('./products.service');
const sendResponse = require('../../utils/sendResponse');

// GET /api/products
const getAll = async (req, res, next) => {
  try {
    const products = await productsService.getAllProducts();
    return sendResponse(res, 200, true, 'Products retrieved successfully', products);
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getOne = async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.id);
    return sendResponse(res, 200, true, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const create = async (req, res, next) => {
  try {
    const product = await productsService.createProduct(req.body);
    return sendResponse(res, 201, true, 'Product created successfully', product);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id
const update = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body);
    return sendResponse(res, 200, true, 'Product updated successfully', product);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const remove = async (req, res, next) => {
  try {
    const product = await productsService.deleteProduct(req.params.id);
    return sendResponse(res, 200, true, 'Product deleted successfully', product);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/variants
const addVariant = async (req, res, next) => {
  try {
    const variant = await productsService.addVariant(req.params.id, req.body);
    return sendResponse(res, 201, true, 'Variant added successfully', variant);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/variants/:variantId
const updateVariant = async (req, res, next) => {
  try {
    const variant = await productsService.updateVariant(
      req.params.id,
      req.params.variantId,
      req.body
    );
    return sendResponse(res, 200, true, 'Variant updated successfully', variant);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/aliases
const addAlias = async (req, res, next) => {
  try {
    const alias = await productsService.addAlias(req.params.id, req.body.alias);
    return sendResponse(res, 201, true, 'Alias added successfully', alias);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, remove, addVariant, updateVariant, addAlias };
