// orders.seed.js — seeds 15 realistic orders across all salesmen.
//
// Status distribution:
//   DELIVERED:            5 orders (complete lifecycle, used for dashboard revenue)
//   DISPATCHED:           2 orders (in transit)
//   CONFIRMED:            4 orders (confirmed by supervisor)
//   PENDING_CONFIRMATION: 3 orders (awaiting review)
//   DRAFT:                1 order  (just created by salesman)
//
// Every order is linked to the salesman who owns that shop (no cross-assignments).
// rawTranscript is populated for voice orders (simulates AI-processed audio).

const { USER_IDS } = require('./users.seed');
const { SHOP_IDS }  = require('./shops.seed');

// ─── Fixed UUIDs (50-prefix = orders) ────────────────────────────────────────
const ORDER_IDS = {
  O01: '50000000-0000-0000-0000-000000000001', // Raj  → Sharma Kirana  (DELIVERED)
  O02: '50000000-0000-0000-0000-000000000002', // Raj  → Sharma Kirana  (DELIVERED)
  O03: '50000000-0000-0000-0000-000000000003', // Raj  → Gupta General  (CONFIRMED)
  O04: '50000000-0000-0000-0000-000000000004', // Raj  → Gupta General  (PENDING_CONFIRMATION)
  O05: '50000000-0000-0000-0000-000000000005', // Sunil→ Krishna Super  (DELIVERED)
  O06: '50000000-0000-0000-0000-000000000006', // Sunil→ Krishna Super  (DISPATCHED)
  O07: '50000000-0000-0000-0000-000000000007', // Sunil→ Hari Om Retail (CONFIRMED)
  O08: '50000000-0000-0000-0000-000000000008', // Kavita→ Om Provision  (PENDING_CONFIRMATION)
  O09: '50000000-0000-0000-0000-000000000009', // Deepak→ Maa Durga     (DELIVERED)
  O10: '50000000-0000-0000-0000-000000000010', // Anita → Ganesh Dept   (CONFIRMED)
  O11: '50000000-0000-0000-0000-000000000011', // Mohit → Laxmi Kirana  (DISPATCHED)
  O12: '50000000-0000-0000-0000-000000000012', // Mohit → Laxmi Kirana  (PENDING_CONFIRMATION)
  O13: '50000000-0000-0000-0000-000000000013', // Rekha → Shree Ram     (DELIVERED)
  O14: '50000000-0000-0000-0000-000000000014', // Vijay → Bharat Prov   (CONFIRMED)
  O15: '50000000-0000-0000-0000-000000000015', // Vijay → Bharat Prov   (DRAFT)
};

const seedOrders = async (db) => {
  const ordersData = [
    // ─── DELIVERED orders ───────────────────────────────────────────────────
    {
      id:           ORDER_IDS.O01,
      shopId:       SHOP_IDS.SHARMA_KIRANA,
      salesmanId:   USER_IDS.SALESMAN_1,
      createdBy:    USER_IDS.SALESMAN_1,
      status:       'DELIVERED',
      rawTranscript: 'Sharma Kirana ke liye 10 packet Aloo Bhujia 500 gram aur 5 packet Sev 200 gram chahiye.',
      confirmedAt:  new Date('2026-06-16T10:00:00Z'),
      createdAt:    new Date('2026-06-15T09:00:00Z'),
      updatedAt:    new Date('2026-06-18T16:00:00Z'),
    },
    {
      id:           ORDER_IDS.O02,
      shopId:       SHOP_IDS.SHARMA_KIRANA,
      salesmanId:   USER_IDS.SALESMAN_1,
      createdBy:    USER_IDS.SALESMAN_1,
      status:       'DELIVERED',
      rawTranscript: 'Sharma Store ke liye 8 packet Mixture 500 gram aur 12 packet Moong Dal 200 gram.',
      confirmedAt:  new Date('2026-06-23T11:00:00Z'),
      createdAt:    new Date('2026-06-22T08:30:00Z'),
      updatedAt:    new Date('2026-06-25T15:00:00Z'),
    },
    {
      id:           ORDER_IDS.O05,
      shopId:       SHOP_IDS.KRISHNA_SUPER,
      salesmanId:   USER_IDS.SALESMAN_2,
      createdBy:    USER_IDS.SALESMAN_2,
      status:       'DELIVERED',
      rawTranscript: 'Krishna Store ke liye 15 packet Bhujia aur 10 packet Masala Peanuts 500 gram.',
      confirmedAt:  new Date('2026-06-28T10:30:00Z'),
      createdAt:    new Date('2026-06-27T08:00:00Z'),
      updatedAt:    new Date('2026-06-30T14:00:00Z'),
    },
    {
      id:           ORDER_IDS.O09,
      shopId:       SHOP_IDS.MAA_DURGA,
      salesmanId:   USER_IDS.SALESMAN_4,
      createdBy:    USER_IDS.SALESMAN_4,
      status:       'DELIVERED',
      rawTranscript: 'Durga Store ke liye 20 packet Khatta Meetha 200 gram aur 5 packet Bhakarwadi 500 gram.',
      confirmedAt:  new Date('2026-07-02T09:00:00Z'),
      createdAt:    new Date('2026-07-01T07:30:00Z'),
      updatedAt:    new Date('2026-07-04T16:30:00Z'),
    },
    {
      id:           ORDER_IDS.O13,
      shopId:       SHOP_IDS.SHREE_RAM,
      salesmanId:   USER_IDS.SALESMAN_7,
      createdBy:    USER_IDS.SALESMAN_7,
      status:       'DELIVERED',
      rawTranscript: null, // Manual order
      confirmedAt:  new Date('2026-07-07T10:00:00Z'),
      createdAt:    new Date('2026-07-06T09:00:00Z'),
      updatedAt:    new Date('2026-07-09T15:00:00Z'),
    },

    // ─── DISPATCHED orders ──────────────────────────────────────────────────
    {
      id:           ORDER_IDS.O06,
      shopId:       SHOP_IDS.KRISHNA_SUPER,
      salesmanId:   USER_IDS.SALESMAN_2,
      createdBy:    USER_IDS.SALESMAN_2,
      status:       'DISPATCHED',
      rawTranscript: 'Suresh Bhai ke liye 10 packet Corn Mix aur 8 packet Chana Dal 500 gram.',
      confirmedAt:  new Date('2026-07-09T10:00:00Z'),
      createdAt:    new Date('2026-07-08T09:30:00Z'),
      updatedAt:    new Date('2026-07-11T13:00:00Z'),
    },
    {
      id:           ORDER_IDS.O11,
      shopId:       SHOP_IDS.LAXMI_KIRANA,
      salesmanId:   USER_IDS.SALESMAN_6,
      createdBy:    USER_IDS.ADMIN, // Admin placed order on behalf of salesman
      status:       'DISPATCHED',
      rawTranscript: null,
      confirmedAt:  new Date('2026-07-10T11:00:00Z'),
      createdAt:    new Date('2026-07-09T10:00:00Z'),
      updatedAt:    new Date('2026-07-12T14:00:00Z'),
    },

    // ─── CONFIRMED orders ───────────────────────────────────────────────────
    {
      id:           ORDER_IDS.O03,
      shopId:       SHOP_IDS.GUPTA_GENERAL,
      salesmanId:   USER_IDS.SALESMAN_1,
      createdBy:    USER_IDS.SALESMAN_1,
      status:       'CONFIRMED',
      rawTranscript: 'Gupta Ji ke liye 6 packet Salted Peanuts 500 gram aur 10 packet Sev.',
      confirmedAt:  new Date('2026-07-11T10:00:00Z'),
      createdAt:    new Date('2026-07-10T08:00:00Z'),
      updatedAt:    new Date('2026-07-11T10:00:00Z'),
    },
    {
      id:           ORDER_IDS.O07,
      shopId:       SHOP_IDS.HARI_OM_RETAIL,
      salesmanId:   USER_IDS.SALESMAN_2,
      createdBy:    USER_IDS.SALESMAN_2,
      status:       'CONFIRMED',
      rawTranscript: 'Hari Om Shop ke liye 15 packet Mixture 200 gram aur 5 packet Moong Dal 500 gram.',
      confirmedAt:  new Date('2026-07-12T09:00:00Z'),
      createdAt:    new Date('2026-07-11T09:00:00Z'),
      updatedAt:    new Date('2026-07-12T09:00:00Z'),
    },
    {
      id:           ORDER_IDS.O10,
      shopId:       SHOP_IDS.GANESH_DEPT,
      salesmanId:   USER_IDS.SALESMAN_5,
      createdBy:    USER_IDS.SALESMAN_5,
      status:       'CONFIRMED',
      rawTranscript: null,
      confirmedAt:  new Date('2026-07-12T14:00:00Z'),
      createdAt:    new Date('2026-07-11T13:00:00Z'),
      updatedAt:    new Date('2026-07-12T14:00:00Z'),
    },
    {
      id:           ORDER_IDS.O14,
      shopId:       SHOP_IDS.BHARAT_PROVISIONS,
      salesmanId:   USER_IDS.SALESMAN_8,
      createdBy:    USER_IDS.SALESMAN_8,
      status:       'CONFIRMED',
      rawTranscript: 'Bharat Bhai ke liye 8 packet Bhakarwadi aur 10 packet Khatta Meetha.',
      confirmedAt:  new Date('2026-07-13T10:00:00Z'),
      createdAt:    new Date('2026-07-12T10:00:00Z'),
      updatedAt:    new Date('2026-07-13T10:00:00Z'),
    },

    // ─── PENDING_CONFIRMATION orders ────────────────────────────────────────
    {
      id:           ORDER_IDS.O04,
      shopId:       SHOP_IDS.GUPTA_GENERAL,
      salesmanId:   USER_IDS.SALESMAN_1,
      createdBy:    USER_IDS.SALESMAN_1,
      status:       'PENDING_CONFIRMATION',
      rawTranscript: 'Mahesh Bhai ki dukaan ke liye 12 packet Aloo Bhujia 200 gram.',
      confirmedAt:  null,
      createdAt:    new Date('2026-07-13T14:00:00Z'),
      updatedAt:    new Date('2026-07-13T14:00:00Z'),
    },
    {
      id:           ORDER_IDS.O08,
      shopId:       SHOP_IDS.OM_PROVISION,
      salesmanId:   USER_IDS.SALESMAN_3,
      createdBy:    USER_IDS.SALESMAN_3,
      status:       'PENDING_CONFIRMATION',
      rawTranscript: 'Om Store ke liye 10 packet Masala Dana aur 6 packet Corn Mix 500 gram.',
      confirmedAt:  null,
      createdAt:    new Date('2026-07-13T16:00:00Z'),
      updatedAt:    new Date('2026-07-13T16:00:00Z'),
    },
    {
      id:           ORDER_IDS.O12,
      shopId:       SHOP_IDS.LAXMI_KIRANA,
      salesmanId:   USER_IDS.SALESMAN_6,
      createdBy:    USER_IDS.SALESMAN_6,
      status:       'PENDING_CONFIRMATION',
      rawTranscript: null,
      confirmedAt:  null,
      createdAt:    new Date('2026-07-14T07:00:00Z'),
      updatedAt:    new Date('2026-07-14T07:00:00Z'),
    },

    // ─── DRAFT order ────────────────────────────────────────────────────────
    {
      id:           ORDER_IDS.O15,
      shopId:       SHOP_IDS.BHARAT_PROVISIONS,
      salesmanId:   USER_IDS.SALESMAN_8,
      createdBy:    USER_IDS.SALESMAN_8,
      status:       'DRAFT',
      rawTranscript: null,
      confirmedAt:  null,
      createdAt:    new Date('2026-07-14T08:00:00Z'),
      updatedAt:    new Date('2026-07-14T08:00:00Z'),
    },
  ];

  const { orders } = require('../schema');
  await db.insert(orders).values(ordersData);
  console.log(`  ✔ Orders seeded (${ordersData.length} records)`);

  return ORDER_IDS;
};

module.exports = { seedOrders, ORDER_IDS };
