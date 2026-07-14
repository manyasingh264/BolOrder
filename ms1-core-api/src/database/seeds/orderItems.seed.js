// orderItems.seed.js — seeds 2-4 items per order (45 items total).
//
// Key rule: subtotal = quantity × unitPrice (calculated here, not by DB trigger).
// unitPrice matches the variant's price at seed time (price snapshot pattern).
// This ensures dashboard revenue totals are consistent and accurate.

const { ORDER_IDS } = require('./orders.seed');
const { VARIANT_IDS } = require('./productVariants.seed');

// Helper: calculate subtotal
const calc = (price, qty) => (parseFloat(price) * qty).toFixed(2);

const seedOrderItems = async (db) => {
  const itemsData = [
    // ─── O01: Sharma Kirana — DELIVERED ─────────────────────────────────────
    { orderId: ORDER_IDS.O01, productVariantId: VARIANT_IDS.AB_500G, quantity: 10, unitPrice: '65.00', subtotal: calc('65.00', 10) },
    { orderId: ORDER_IDS.O01, productVariantId: VARIANT_IDS.SV_200G, quantity: 5,  unitPrice: '24.00', subtotal: calc('24.00', 5)  },
    { orderId: ORDER_IDS.O01, productVariantId: VARIANT_IDS.KM_200G, quantity: 8,  unitPrice: '30.00', subtotal: calc('30.00', 8)  },

    // ─── O02: Sharma Kirana — DELIVERED ─────────────────────────────────────
    { orderId: ORDER_IDS.O02, productVariantId: VARIANT_IDS.MX_500G, quantity: 8,  unitPrice: '75.00', subtotal: calc('75.00', 8)  },
    { orderId: ORDER_IDS.O02, productVariantId: VARIANT_IDS.MD_200G, quantity: 12, unitPrice: '38.00', subtotal: calc('38.00', 12) },

    // ─── O03: Gupta General — CONFIRMED ─────────────────────────────────────
    { orderId: ORDER_IDS.O03, productVariantId: VARIANT_IDS.SP_500G, quantity: 6,  unitPrice: '88.00', subtotal: calc('88.00', 6)  },
    { orderId: ORDER_IDS.O03, productVariantId: VARIANT_IDS.SV_500G, quantity: 10, unitPrice: '55.00', subtotal: calc('55.00', 10) },
    { orderId: ORDER_IDS.O03, productVariantId: VARIANT_IDS.AB_200G, quantity: 15, unitPrice: '28.00', subtotal: calc('28.00', 15) },

    // ─── O04: Gupta General — PENDING_CONFIRMATION ──────────────────────────
    { orderId: ORDER_IDS.O04, productVariantId: VARIANT_IDS.AB_200G, quantity: 12, unitPrice: '28.00', subtotal: calc('28.00', 12) },
    { orderId: ORDER_IDS.O04, productVariantId: VARIANT_IDS.MX_200G, quantity: 6,  unitPrice: '32.00', subtotal: calc('32.00', 6)  },

    // ─── O05: Krishna Super — DELIVERED ─────────────────────────────────────
    { orderId: ORDER_IDS.O05, productVariantId: VARIANT_IDS.AB_500G, quantity: 15, unitPrice: '65.00', subtotal: calc('65.00', 15) },
    { orderId: ORDER_IDS.O05, productVariantId: VARIANT_IDS.MP_500G, quantity: 10, unitPrice: '98.00', subtotal: calc('98.00', 10) },
    { orderId: ORDER_IDS.O05, productVariantId: VARIANT_IDS.SV_200G, quantity: 20, unitPrice: '24.00', subtotal: calc('24.00', 20) },

    // ─── O06: Krishna Super — DISPATCHED ────────────────────────────────────
    { orderId: ORDER_IDS.O06, productVariantId: VARIANT_IDS.CF_200G, quantity: 10, unitPrice: '32.00', subtotal: calc('32.00', 10) },
    { orderId: ORDER_IDS.O06, productVariantId: VARIANT_IDS.CD_500G, quantity: 8,  unitPrice: '80.00', subtotal: calc('80.00', 8)  },

    // ─── O07: Hari Om Retail — CONFIRMED ────────────────────────────────────
    { orderId: ORDER_IDS.O07, productVariantId: VARIANT_IDS.MX_200G, quantity: 15, unitPrice: '32.00', subtotal: calc('32.00', 15) },
    { orderId: ORDER_IDS.O07, productVariantId: VARIANT_IDS.MD_500G, quantity: 5,  unitPrice: '88.00', subtotal: calc('88.00', 5)  },
    { orderId: ORDER_IDS.O07, productVariantId: VARIANT_IDS.KM_500G, quantity: 10, unitPrice: '68.00', subtotal: calc('68.00', 10) },

    // ─── O08: Om Provision — PENDING_CONFIRMATION ───────────────────────────
    { orderId: ORDER_IDS.O08, productVariantId: VARIANT_IDS.MP_200G, quantity: 10, unitPrice: '42.00', subtotal: calc('42.00', 10) },
    { orderId: ORDER_IDS.O08, productVariantId: VARIANT_IDS.CF_500G, quantity: 6,  unitPrice: '75.00', subtotal: calc('75.00', 6)  },

    // ─── O09: Maa Durga — DELIVERED ─────────────────────────────────────────
    { orderId: ORDER_IDS.O09, productVariantId: VARIANT_IDS.KM_200G, quantity: 20, unitPrice: '30.00', subtotal: calc('30.00', 20) },
    { orderId: ORDER_IDS.O09, productVariantId: VARIANT_IDS.BW_500G, quantity: 5,  unitPrice: '120.00', subtotal: calc('120.00', 5) },
    { orderId: ORDER_IDS.O09, productVariantId: VARIANT_IDS.SP_200G, quantity: 10, unitPrice: '38.00', subtotal: calc('38.00', 10) },

    // ─── O10: Ganesh Dept — CONFIRMED ───────────────────────────────────────
    { orderId: ORDER_IDS.O10, productVariantId: VARIANT_IDS.BW_200G, quantity: 12, unitPrice: '52.00', subtotal: calc('52.00', 12) },
    { orderId: ORDER_IDS.O10, productVariantId: VARIANT_IDS.AB_200G, quantity: 20, unitPrice: '28.00', subtotal: calc('28.00', 20) },
    { orderId: ORDER_IDS.O10, productVariantId: VARIANT_IDS.SV_500G, quantity: 8,  unitPrice: '55.00', subtotal: calc('55.00', 8)  },

    // ─── O11: Laxmi Kirana — DISPATCHED ─────────────────────────────────────
    { orderId: ORDER_IDS.O11, productVariantId: VARIANT_IDS.CD_200G, quantity: 10, unitPrice: '34.00', subtotal: calc('34.00', 10) },
    { orderId: ORDER_IDS.O11, productVariantId: VARIANT_IDS.MX_500G, quantity: 6,  unitPrice: '75.00', subtotal: calc('75.00', 6)  },

    // ─── O12: Laxmi Kirana — PENDING_CONFIRMATION ───────────────────────────
    { orderId: ORDER_IDS.O12, productVariantId: VARIANT_IDS.AB_500G, quantity: 8,  unitPrice: '65.00', subtotal: calc('65.00', 8)  },
    { orderId: ORDER_IDS.O12, productVariantId: VARIANT_IDS.KM_500G, quantity: 5,  unitPrice: '68.00', subtotal: calc('68.00', 5)  },
    { orderId: ORDER_IDS.O12, productVariantId: VARIANT_IDS.MP_200G, quantity: 10, unitPrice: '42.00', subtotal: calc('42.00', 10) },

    // ─── O13: Shree Ram — DELIVERED ─────────────────────────────────────────
    { orderId: ORDER_IDS.O13, productVariantId: VARIANT_IDS.SV_200G, quantity: 20, unitPrice: '24.00', subtotal: calc('24.00', 20) },
    { orderId: ORDER_IDS.O13, productVariantId: VARIANT_IDS.MD_200G, quantity: 10, unitPrice: '38.00', subtotal: calc('38.00', 10) },
    { orderId: ORDER_IDS.O13, productVariantId: VARIANT_IDS.CF_200G, quantity: 8,  unitPrice: '32.00', subtotal: calc('32.00', 8)  },

    // ─── O14: Bharat Provisions — CONFIRMED ─────────────────────────────────
    { orderId: ORDER_IDS.O14, productVariantId: VARIANT_IDS.BW_200G, quantity: 8,  unitPrice: '52.00', subtotal: calc('52.00', 8)  },
    { orderId: ORDER_IDS.O14, productVariantId: VARIANT_IDS.KM_200G, quantity: 10, unitPrice: '30.00', subtotal: calc('30.00', 10) },
    { orderId: ORDER_IDS.O14, productVariantId: VARIANT_IDS.SP_500G, quantity: 4,  unitPrice: '88.00', subtotal: calc('88.00', 4)  },

    // ─── O15: Bharat Provisions — DRAFT ─────────────────────────────────────
    { orderId: ORDER_IDS.O15, productVariantId: VARIANT_IDS.AB_200G, quantity: 5,  unitPrice: '28.00', subtotal: calc('28.00', 5)  },
    { orderId: ORDER_IDS.O15, productVariantId: VARIANT_IDS.MX_200G, quantity: 3,  unitPrice: '32.00', subtotal: calc('32.00', 3)  },
  ];

  const { orderItems } = require('../schema');
  await db.insert(orderItems).values(itemsData);
  console.log(`  ✔ Order items seeded (${itemsData.length} records)`);
};

module.exports = { seedOrderItems };
