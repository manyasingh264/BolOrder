// orders.service.js — business logic for the orders module.
//
// This is the most complex service in the project. Rules enforced:
//   1. Order access: SALESMAN can only see/modify their own orders
//   2. Item operations: only allowed on DRAFT orders
//   3. Status transitions: enforced by VALID_STATUS_TRANSITIONS map
//   4. Price snapshot: unit_price is locked at the time of order creation
//   5. SALESMAN cannot update order status (route-level restriction)
//   6. Subtotal = quantity × unitPrice (calculated here, stored in DB)

const ordersRepository = require('./orders.repository');
const AppError = require('../../utils/AppError');
const { ROLES, ORDER_STATUSES, VALID_STATUS_TRANSITIONS } = require('../../constants');

// ─── Get All Orders ───────────────────────────────────────────────────────────

const getAllOrders = async (requestingUser) => {
  let orders;
  if (requestingUser.role === ROLES.SALESMAN) {
    orders = await ordersRepository.findOrdersBySalesmanId(requestingUser.userId);
  } else {
    orders = await ordersRepository.findAllOrders();
  }

  // Transform nested objects to flat fields for frontend
  return orders.map(order => {
    const itemCount = order.items?.length || 0;
    const totalAmount = order.items?.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      return sum + subtotal;
    }, 0) || 0;

    return {
      ...order,
      shopName: order.shop?.shopName || null,
      shopArea: order.shop?.address || null,
      salesmanName: order.salesman?.name || null,
      itemCount,
      totalAmount,
    };
  });
};

// ─── Get One Order ────────────────────────────────────────────────────────────

const getOrderById = async (id, requestingUser) => {
  const order = await ordersRepository.findOrderById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // SALESMAN can only view their own orders
  if (
    requestingUser.role === ROLES.SALESMAN &&
    order.salesmanId !== requestingUser.userId
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  // Transform nested objects to flat fields for frontend
  const itemCount = order.items?.length || 0;
  const totalAmount = order.items?.reduce((sum, item) => {
    const subtotal = parseFloat(item.subtotal) || 0;
    return sum + subtotal;
  }, 0) || 0;

  // Flatten items structure
  const items = order.items?.map(item => ({
    ...item,
    productName: item.productVariant?.product?.name || null,
    variantSize: item.productVariant?.size || null,
    unit: item.productVariant?.unit || null,
  })) || [];

  return {
    ...order,
    shopName: order.shop?.shopName || null,
    shopArea: order.shop?.address || null,
    salesmanName: order.salesman?.name || null,
    itemCount,
    totalAmount,
    items,
  };
};

// ─── Create Order ─────────────────────────────────────────────────────────────

const createOrder = async (orderData, requestingUser) => {
  const { shopId, items = [], status = ORDER_STATUSES.DRAFT } = orderData;

  // SALESMAN always creates for themselves; ADMIN/SUPERVISOR can specify salesmanId
  const salesmanId =
    requestingUser.role === ROLES.SALESMAN
      ? requestingUser.userId
      : (orderData.salesmanId || requestingUser.userId);

  // 1. Create the order record
  const newOrder = await ordersRepository.createOrder({
    shopId,
    salesmanId,
    createdBy:     requestingUser.userId,
    status,
    rawTranscript: orderData.rawTranscript || null,
  });

  // 2. Add initial status history entry
  await ordersRepository.createStatusHistoryEntry({
    orderId:   newOrder.id,
    oldStatus: null,
    newStatus: status,
    updatedBy: requestingUser.userId,
    remarks:   'Order created',
  });

  // 3. Add items if provided (batch insert)
  if (items.length > 0) {
    const itemsToInsert = await _buildOrderItems(newOrder.id, items);
    await ordersRepository.createOrderItems(itemsToInsert);
  }

  // 4. Return the full order detail
  return ordersRepository.findOrderById(newOrder.id);
};

// ─── Add Item to DRAFT Order ──────────────────────────────────────────────────

const addItem = async (orderId, itemData, requestingUser) => {
  const order = await ordersRepository.findOrderById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  // Rule: Only DRAFT orders can be modified
  if (order.status !== ORDER_STATUSES.DRAFT) {
    throw new AppError(
      `Cannot add items to an order with status "${order.status}". Only DRAFT orders can be modified.`,
      400
    );
  }

  // Rule: SALESMAN can only modify their own orders
  if (
    requestingUser.role === ROLES.SALESMAN &&
    order.salesmanId !== requestingUser.userId
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  const [itemRow] = await _buildOrderItems(orderId, [itemData]);
  const [inserted] = await ordersRepository.createOrderItems([itemRow]);
  return inserted;
};

// ─── Remove Item from DRAFT Order ────────────────────────────────────────────

const removeItem = async (orderId, itemId, requestingUser) => {
  const order = await ordersRepository.findOrderById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  if (order.status !== ORDER_STATUSES.DRAFT) {
    throw new AppError(
      `Cannot remove items from an order with status "${order.status}".`,
      400
    );
  }

  if (
    requestingUser.role === ROLES.SALESMAN &&
    order.salesmanId !== requestingUser.userId
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  const item = await ordersRepository.findOrderItemById(itemId);

  if (!item || item.orderId !== orderId) {
    throw new AppError('Order item not found', 404);
  }

  await ordersRepository.deleteOrderItem(itemId);
  return { message: 'Item removed from order' };
};

// ─── Update Order Status ──────────────────────────────────────────────────────

const updateStatus = async (orderId, newStatus, remarks, requestingUser) => {
  const order = await ordersRepository.findOrderById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  // Validate transition using the state machine
  const allowedNext = VALID_STATUS_TRANSITIONS[order.status] || [];

  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Cannot transition order from "${order.status}" to "${newStatus}". ` +
      `Allowed transitions: ${allowedNext.length ? allowedNext.join(', ') : 'none (terminal state)'}`,
      400
    );
  }

  // Update the order status
  const updatedOrder = await ordersRepository.updateOrderStatus(orderId, newStatus);

  // Append to audit trail
  await ordersRepository.createStatusHistoryEntry({
    orderId:   orderId,
    oldStatus: order.status,
    newStatus: newStatus,
    updatedBy: requestingUser.userId,
    remarks:   remarks || null,
  });

  return ordersRepository.findOrderById(updatedOrder.id);
};

const deleteOrder = async (orderId, requestingUser) => {
  const order = await ordersRepository.findOrderById(orderId);

  if (!order) throw new AppError('Order not found', 404);

  // Only DRAFT orders can be deleted
  if (order.status !== ORDER_STATUSES.DRAFT) {
    throw new AppError(
      `Cannot delete order with status "${order.status}". Only DRAFT orders can be deleted.`,
      400
    );
  }

  // SALESMAN can only delete their own orders
  if (
    requestingUser.role === ROLES.SALESMAN &&
    order.salesmanId !== requestingUser.userId
  ) {
    throw new AppError('You do not have access to this order', 403);
  }

  await ordersRepository.deleteOrder(orderId);
  return { message: 'Order deleted successfully' };
};

// ─── Voice Order ──────────────────────────────────────────────────────────────
// Called after the AI microservice returns parsed order data.
// Creates the order directly in PENDING_CONFIRMATION status.

const createVoiceOrder = async (voiceData, requestingUser) => {
  return createOrder(
    {
      ...voiceData,
      status: ORDER_STATUSES.PENDING_CONFIRMATION, // voice orders skip DRAFT
    },
    requestingUser
  );
};

// ─── Private Helper ───────────────────────────────────────────────────────────

// Fetches prices from the DB and builds the orderItems rows array
const _buildOrderItems = async (orderId, items) => {
  return Promise.all(
    items.map(async ({ productVariantId, quantity }) => {
      const variant = await ordersRepository.findVariantById(productVariantId);

      if (!variant) {
        throw new AppError(`Product variant ${productVariantId} not found`, 404);
      }

      const unitPrice = parseFloat(variant.price);
      const subtotal  = parseFloat((unitPrice * quantity).toFixed(2));

      return {
        orderId,
        productVariantId,
        quantity,
        unitPrice: unitPrice.toFixed(2),
        subtotal:  subtotal.toFixed(2),
      };
    })
  );
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  addItem,
  removeItem,
  updateStatus,
  deleteOrder,
  createVoiceOrder,
};
