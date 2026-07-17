// orders.repository.js — all Drizzle queries for orders, order items, and status history.
//
// Design decisions:
//   - findAllOrders: lean list (order + shop name + salesman name, no items)
//   - findOrderById: full detail (items with variant info + full status history)
//   - Prices are stored on order_items at creation time (snapshot pattern)

const { eq, desc } = require('drizzle-orm');
const { db } = require('../../database/db');
const { orders, orderItems, orderStatusHistory, productVariants } = require('../../database/schema');

// ─── Orders ───────────────────────────────────────────────────────────────────

// Lean list — includes items for count/total calculation
const findAllOrders = async () => {
  return db.query.orders.findMany({
    with: {
      shop:     { columns: { id: true, shopName: true, ownerName: true } },
      salesman: { columns: { id: true, name: true } },
      items:    { columns: { id: true, quantity: true, subtotal: true } },
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
};

// Salesman-scoped list
const findOrdersBySalesmanId = async (salesmanId) => {
  return db.query.orders.findMany({
    where: (orders, { eq }) => eq(orders.salesmanId, salesmanId),
    with: {
      shop:     { columns: { id: true, shopName: true, ownerName: true } },
      salesman: { columns: { id: true, name: true } },
      items:    { columns: { id: true, quantity: true, subtotal: true } },
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
};

// Full detail — used for order detail page
const findOrderById = async (id) => {
  return db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.id, id),
    with: {
      shop:          { columns: { id: true, shopName: true, ownerName: true, phone: true, address: true } },
      salesman:      { columns: { id: true, name: true, email: true, role: true } },
      createdByUser: { columns: { id: true, name: true } },
      items: {
        with: {
          productVariant: {
            columns: { id: true, size: true, unit: true, sku: true, price: true },
            with: {
              product: { columns: { id: true, name: true, category: true } },
            },
          },
        },
      },
      statusHistory: {
        orderBy: (h, { asc }) => [asc(h.changedAt)],
      },
    },
  });
};

// ─── Create Order ─────────────────────────────────────────────────────────────

const createOrder = async (orderData) => {
  const result = await db.insert(orders).values(orderData).returning();
  return result[0];
};

// Batch insert multiple order items at once
const createOrderItems = async (itemsArray) => {
  if (itemsArray.length === 0) return [];
  return db.insert(orderItems).values(itemsArray).returning();
};

// ─── Get one variant to read current price ────────────────────────────────────
const findVariantById = async (id) => {
  const result = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);

  return result[0] || null;
};

// ─── Order Item operations ────────────────────────────────────────────────────

const findOrderItemById = async (id) => {
  const result = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, id))
    .limit(1);

  return result[0] || null;
};

const deleteOrderItem = async (id) => {
  await db.delete(orderItems).where(eq(orderItems.id, id));
};

// ─── Status Operations ────────────────────────────────────────────────────────

// Update the order status (and set confirmedAt if transitioning to CONFIRMED)
const updateOrderStatus = async (id, newStatus) => {
  const updateData = {
    status:    newStatus,
    updatedAt: new Date(),
  };

  // Set confirmedAt timestamp when order is confirmed
  if (newStatus === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
  }

  const result = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, id))
    .returning();

  return result[0];
};

// Delete an order
const deleteOrder = async (id) => {
  await db.delete(orders).where(eq(orders.id, id));
};

// Append a row to order_status_history (immutable audit trail)
const createStatusHistoryEntry = async (historyData) => {
  const result = await db
    .insert(orderStatusHistory)
    .values(historyData)
    .returning();

  return result[0];
};

module.exports = {
  findAllOrders,
  findOrdersBySalesmanId,
  findOrderById,
  createOrder,
  createOrderItems,
  findVariantById,
  findOrderItemById,
  deleteOrderItem,
  updateOrderStatus,
  deleteOrder,
  createStatusHistoryEntry,
};
