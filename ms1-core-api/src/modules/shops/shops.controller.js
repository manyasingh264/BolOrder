// shops.controller.js — handles HTTP requests for the shops module.

const shopsService = require('./shops.service');
const sendResponse = require('../../utils/sendResponse');

// GET /api/shops
// SALESMAN sees only their shops; ADMIN/SUPERVISOR see all
const getAll = async (req, res, next) => {
  try {
    const shops = await shopsService.getAllShops(req.user);
    return sendResponse(res, 200, true, 'Shops retrieved successfully', shops);
  } catch (error) {
    next(error);
  }
};

// GET /api/shops/:id
const getOne = async (req, res, next) => {
  try {
    const shop = await shopsService.getShopById(req.params.id, req.user);
    return sendResponse(res, 200, true, 'Shop retrieved successfully', shop);
  } catch (error) {
    next(error);
  }
};

// POST /api/shops
const create = async (req, res, next) => {
  try {
    const shop = await shopsService.createShop(req.body);
    return sendResponse(res, 201, true, 'Shop created successfully', shop);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/shops/:id
const update = async (req, res, next) => {
  try {
    const shop = await shopsService.updateShop(req.params.id, req.body);
    return sendResponse(res, 200, true, 'Shop updated successfully', shop);
  } catch (error) {
    next(error);
  }
};

// POST /api/shops/:id/aliases
const addAlias = async (req, res, next) => {
  try {
    const alias = await shopsService.addAlias(req.params.id, req.body.alias);
    return sendResponse(res, 201, true, 'Alias added successfully', alias);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, addAlias };
