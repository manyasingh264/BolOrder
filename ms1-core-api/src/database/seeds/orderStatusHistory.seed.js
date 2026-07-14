// orderStatusHistory.seed.js — seeds the complete audit trail for all 15 orders.
//
// Every transition is recorded as a separate row.
// This is an immutable log — it is never updated, only appended.
//
// Transition progressions used:
//   DELIVERED orders:            null→PENDING → PENDING→CONFIRMED → CONFIRMED→DISPATCHED → DISPATCHED→DELIVERED
//   DISPATCHED orders:           null→PENDING → PENDING→CONFIRMED → CONFIRMED→DISPATCHED
//   CONFIRMED orders:            null→PENDING → PENDING→CONFIRMED
//   PENDING_CONFIRMATION orders: null→PENDING
//   DRAFT order:                 null→DRAFT
//
// updatedBy is the person who performed the status change:
//   - SALESMAN creates the order (null→PENDING or null→DRAFT)
//   - SUPERVISOR or ADMIN confirms, dispatches, delivers

const { USER_IDS } = require('./users.seed');
const { ORDER_IDS } = require('./orders.seed');

const S  = USER_IDS.SUPERVISOR;
const AD = USER_IDS.ADMIN;

const seedOrderStatusHistory = async (db) => {
  const historyData = [
    // ─── O01: DELIVERED (Raj Verma → Sharma Kirana) ─────────────────────────
    { orderId: ORDER_IDS.O01, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_1, remarks: 'Order created via voice',             changedAt: new Date('2026-06-15T09:00:00Z') },
    { orderId: ORDER_IDS.O01, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Verified by Priya Sharma',            changedAt: new Date('2026-06-16T10:00:00Z') },
    { orderId: ORDER_IDS.O01, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: S,                  remarks: 'Packed and dispatched from factory',  changedAt: new Date('2026-06-17T11:00:00Z') },
    { orderId: ORDER_IDS.O01, oldStatus: 'DISPATCHED',          newStatus: 'DELIVERED',           updatedBy: S,                  remarks: 'Delivered successfully to shop',      changedAt: new Date('2026-06-18T16:00:00Z') },

    // ─── O02: DELIVERED (Raj Verma → Sharma Kirana) ─────────────────────────
    { orderId: ORDER_IDS.O02, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_1, remarks: 'Order created via voice',             changedAt: new Date('2026-06-22T08:30:00Z') },
    { orderId: ORDER_IDS.O02, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: AD,                 remarks: 'Confirmed by Arjun Mehta',            changedAt: new Date('2026-06-23T11:00:00Z') },
    { orderId: ORDER_IDS.O02, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: S,                  remarks: 'Goods packed and ready for dispatch', changedAt: new Date('2026-06-24T09:00:00Z') },
    { orderId: ORDER_IDS.O02, oldStatus: 'DISPATCHED',          newStatus: 'DELIVERED',           updatedBy: S,                  remarks: 'Delivered successfully',              changedAt: new Date('2026-06-25T15:00:00Z') },

    // ─── O03: CONFIRMED (Raj Verma → Gupta General) ─────────────────────────
    { orderId: ORDER_IDS.O03, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_1, remarks: 'Order created via voice',             changedAt: new Date('2026-07-10T08:00:00Z') },
    { orderId: ORDER_IDS.O03, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Verified and confirmed',              changedAt: new Date('2026-07-11T10:00:00Z') },

    // ─── O04: PENDING_CONFIRMATION (Raj Verma → Gupta General) ─────────────
    { orderId: ORDER_IDS.O04, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_1, remarks: 'Voice order created, awaiting review', changedAt: new Date('2026-07-13T14:00:00Z') },

    // ─── O05: DELIVERED (Sunil Yadav → Krishna Super) ───────────────────────
    { orderId: ORDER_IDS.O05, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_2, remarks: 'Order created via voice',             changedAt: new Date('2026-06-27T08:00:00Z') },
    { orderId: ORDER_IDS.O05, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Verified by Priya Sharma',            changedAt: new Date('2026-06-28T10:30:00Z') },
    { orderId: ORDER_IDS.O05, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: AD,                 remarks: 'Dispatched from factory warehouse',   changedAt: new Date('2026-06-29T10:00:00Z') },
    { orderId: ORDER_IDS.O05, oldStatus: 'DISPATCHED',          newStatus: 'DELIVERED',           updatedBy: S,                  remarks: 'Delivery confirmed by shop owner',    changedAt: new Date('2026-06-30T14:00:00Z') },

    // ─── O06: DISPATCHED (Sunil Yadav → Krishna Super) ──────────────────────
    { orderId: ORDER_IDS.O06, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_2, remarks: 'Order created via voice',             changedAt: new Date('2026-07-08T09:30:00Z') },
    { orderId: ORDER_IDS.O06, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Confirmed by supervisor',             changedAt: new Date('2026-07-09T10:00:00Z') },
    { orderId: ORDER_IDS.O06, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: AD,                 remarks: 'Dispatched via delivery van #3',      changedAt: new Date('2026-07-11T13:00:00Z') },

    // ─── O07: CONFIRMED (Sunil Yadav → Hari Om Retail) ──────────────────────
    { orderId: ORDER_IDS.O07, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_2, remarks: 'Voice order created',                 changedAt: new Date('2026-07-11T09:00:00Z') },
    { orderId: ORDER_IDS.O07, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Order verified and confirmed',         changedAt: new Date('2026-07-12T09:00:00Z') },

    // ─── O08: PENDING_CONFIRMATION (Kavita Joshi → Om Provision) ────────────
    { orderId: ORDER_IDS.O08, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_3, remarks: 'Voice order submitted for review',     changedAt: new Date('2026-07-13T16:00:00Z') },

    // ─── O09: DELIVERED (Deepak Gupta → Maa Durga) ──────────────────────────
    { orderId: ORDER_IDS.O09, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_4, remarks: 'Order created via voice',             changedAt: new Date('2026-07-01T07:30:00Z') },
    { orderId: ORDER_IDS.O09, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Verified by Priya Sharma',            changedAt: new Date('2026-07-02T09:00:00Z') },
    { orderId: ORDER_IDS.O09, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: S,                  remarks: 'Packed and dispatched',               changedAt: new Date('2026-07-03T11:00:00Z') },
    { orderId: ORDER_IDS.O09, oldStatus: 'DISPATCHED',          newStatus: 'DELIVERED',           updatedBy: S,                  remarks: 'Delivered to Dinesh Ji successfully',  changedAt: new Date('2026-07-04T16:30:00Z') },

    // ─── O10: CONFIRMED (Anita Patel → Ganesh Dept) ─────────────────────────
    { orderId: ORDER_IDS.O10, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_5, remarks: 'Order created manually',              changedAt: new Date('2026-07-11T13:00:00Z') },
    { orderId: ORDER_IDS.O10, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: AD,                 remarks: 'Confirmed by Arjun Mehta',            changedAt: new Date('2026-07-12T14:00:00Z') },

    // ─── O11: DISPATCHED (Mohit Sharma → Laxmi Kirana, created by Admin) ────
    { orderId: ORDER_IDS.O11, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: AD,                 remarks: 'Order placed by admin on behalf of salesman', changedAt: new Date('2026-07-09T10:00:00Z') },
    { orderId: ORDER_IDS.O11, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Verified by supervisor',              changedAt: new Date('2026-07-10T11:00:00Z') },
    { orderId: ORDER_IDS.O11, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: AD,                 remarks: 'Dispatched from factory',             changedAt: new Date('2026-07-12T14:00:00Z') },

    // ─── O12: PENDING_CONFIRMATION (Mohit Sharma → Laxmi Kirana) ────────────
    { orderId: ORDER_IDS.O12, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_6, remarks: 'Order submitted for confirmation',     changedAt: new Date('2026-07-14T07:00:00Z') },

    // ─── O13: DELIVERED (Rekha Singh → Shree Ram) ───────────────────────────
    { orderId: ORDER_IDS.O13, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_7, remarks: 'Order created manually',              changedAt: new Date('2026-07-06T09:00:00Z') },
    { orderId: ORDER_IDS.O13, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Confirmed by Priya Sharma',           changedAt: new Date('2026-07-07T10:00:00Z') },
    { orderId: ORDER_IDS.O13, oldStatus: 'CONFIRMED',           newStatus: 'DISPATCHED',          updatedBy: S,                  remarks: 'Dispatched via delivery vehicle',     changedAt: new Date('2026-07-08T12:00:00Z') },
    { orderId: ORDER_IDS.O13, oldStatus: 'DISPATCHED',          newStatus: 'DELIVERED',           updatedBy: S,                  remarks: 'Delivered to Ramkumar Ji',            changedAt: new Date('2026-07-09T15:00:00Z') },

    // ─── O14: CONFIRMED (Vijay Kumar → Bharat Provisions) ───────────────────
    { orderId: ORDER_IDS.O14, oldStatus: null,                 newStatus: 'PENDING_CONFIRMATION', updatedBy: USER_IDS.SALESMAN_8, remarks: 'Voice order submitted',               changedAt: new Date('2026-07-12T10:00:00Z') },
    { orderId: ORDER_IDS.O14, oldStatus: 'PENDING_CONFIRMATION', newStatus: 'CONFIRMED',          updatedBy: S,                  remarks: 'Confirmed by supervisor',             changedAt: new Date('2026-07-13T10:00:00Z') },

    // ─── O15: DRAFT (Vijay Kumar → Bharat Provisions) ───────────────────────
    { orderId: ORDER_IDS.O15, oldStatus: null,                 newStatus: 'DRAFT',                updatedBy: USER_IDS.SALESMAN_8, remarks: 'Order created',                       changedAt: new Date('2026-07-14T08:00:00Z') },
  ];

  const { orderStatusHistory } = require('../schema');
  await db.insert(orderStatusHistory).values(historyData);
  console.log(`  ✔ Order status history seeded (${historyData.length} records)`);
};

module.exports = { seedOrderStatusHistory };
