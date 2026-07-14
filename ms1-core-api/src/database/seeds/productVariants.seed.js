// productVariants.seed.js — seeds 20 product variants (2 per product).
//
// Each product has a 200g and 500g packet variant.
// SKUs follow the pattern: {Product Abbreviation}{Size} — e.g. AB200, AB500
// Prices are realistic factory wholesale prices in INR.

const { PRODUCT_IDS } = require('./products.seed');

// ─── Fixed UUIDs (40-prefix = variants) ──────────────────────────────────────
const VARIANT_IDS = {
  // Aloo Bhujia
  AB_200G: '40000000-0000-0000-0000-000000000001',
  AB_500G: '40000000-0000-0000-0000-000000000002',
  // Sev
  SV_200G: '40000000-0000-0000-0000-000000000003',
  SV_500G: '40000000-0000-0000-0000-000000000004',
  // Mixture
  MX_200G: '40000000-0000-0000-0000-000000000005',
  MX_500G: '40000000-0000-0000-0000-000000000006',
  // Moong Dal
  MD_200G: '40000000-0000-0000-0000-000000000007',
  MD_500G: '40000000-0000-0000-0000-000000000008',
  // Chana Dal
  CD_200G: '40000000-0000-0000-0000-000000000009',
  CD_500G: '40000000-0000-0000-0000-000000000010',
  // Khatta Meetha
  KM_200G: '40000000-0000-0000-0000-000000000011',
  KM_500G: '40000000-0000-0000-0000-000000000012',
  // Masala Peanuts
  MP_200G: '40000000-0000-0000-0000-000000000013',
  MP_500G: '40000000-0000-0000-0000-000000000014',
  // Salted Peanuts
  SP_200G: '40000000-0000-0000-0000-000000000015',
  SP_500G: '40000000-0000-0000-0000-000000000016',
  // Bhakarwadi
  BW_200G: '40000000-0000-0000-0000-000000000017',
  BW_500G: '40000000-0000-0000-0000-000000000018',
  // Corn Flakes Mixture
  CF_200G: '40000000-0000-0000-0000-000000000019',
  CF_500G: '40000000-0000-0000-0000-000000000020',
};

const seedProductVariants = async (db) => {
  const variantsData = [
    // ─── Aloo Bhujia ───────────────────────────────────────────────────────
    { id: VARIANT_IDS.AB_200G, productId: PRODUCT_IDS.ALOO_BHUJIA, size: '200g', unit: 'packet', sku: 'AB200', price: '28.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
    { id: VARIANT_IDS.AB_500G, productId: PRODUCT_IDS.ALOO_BHUJIA, size: '500g', unit: 'packet', sku: 'AB500', price: '65.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },

    // ─── Sev ───────────────────────────────────────────────────────────────
    { id: VARIANT_IDS.SV_200G, productId: PRODUCT_IDS.SEV, size: '200g', unit: 'packet', sku: 'SV200', price: '24.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
    { id: VARIANT_IDS.SV_500G, productId: PRODUCT_IDS.SEV, size: '500g', unit: 'packet', sku: 'SV500', price: '55.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },

    // ─── Mixture ───────────────────────────────────────────────────────────
    { id: VARIANT_IDS.MX_200G, productId: PRODUCT_IDS.MIXTURE, size: '200g', unit: 'packet', sku: 'MX200', price: '32.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
    { id: VARIANT_IDS.MX_500G, productId: PRODUCT_IDS.MIXTURE, size: '500g', unit: 'packet', sku: 'MX500', price: '75.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },

    // ─── Moong Dal ─────────────────────────────────────────────────────────
    { id: VARIANT_IDS.MD_200G, productId: PRODUCT_IDS.MOONG_DAL, size: '200g', unit: 'packet', sku: 'MD200', price: '38.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
    { id: VARIANT_IDS.MD_500G, productId: PRODUCT_IDS.MOONG_DAL, size: '500g', unit: 'packet', sku: 'MD500', price: '88.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },

    // ─── Chana Dal ─────────────────────────────────────────────────────────
    { id: VARIANT_IDS.CD_200G, productId: PRODUCT_IDS.CHANA_DAL, size: '200g', unit: 'packet', sku: 'CD200', price: '34.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },
    { id: VARIANT_IDS.CD_500G, productId: PRODUCT_IDS.CHANA_DAL, size: '500g', unit: 'packet', sku: 'CD500', price: '80.00', createdAt: new Date('2026-05-01'), updatedAt: new Date('2026-05-01') },

    // ─── Khatta Meetha Mix ─────────────────────────────────────────────────
    { id: VARIANT_IDS.KM_200G, productId: PRODUCT_IDS.KHATTA_MEETHA, size: '200g', unit: 'packet', sku: 'KM200', price: '30.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
    { id: VARIANT_IDS.KM_500G, productId: PRODUCT_IDS.KHATTA_MEETHA, size: '500g', unit: 'packet', sku: 'KM500', price: '68.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },

    // ─── Masala Peanuts ────────────────────────────────────────────────────
    { id: VARIANT_IDS.MP_200G, productId: PRODUCT_IDS.MASALA_PEANUTS, size: '200g', unit: 'packet', sku: 'MP200', price: '42.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
    { id: VARIANT_IDS.MP_500G, productId: PRODUCT_IDS.MASALA_PEANUTS, size: '500g', unit: 'packet', sku: 'MP500', price: '98.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },

    // ─── Salted Peanuts ────────────────────────────────────────────────────
    { id: VARIANT_IDS.SP_200G, productId: PRODUCT_IDS.SALTED_PEANUTS, size: '200g', unit: 'packet', sku: 'SP200', price: '38.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
    { id: VARIANT_IDS.SP_500G, productId: PRODUCT_IDS.SALTED_PEANUTS, size: '500g', unit: 'packet', sku: 'SP500', price: '88.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },

    // ─── Bhakarwadi ────────────────────────────────────────────────────────
    { id: VARIANT_IDS.BW_200G, productId: PRODUCT_IDS.BHAKARWADI, size: '200g', unit: 'packet', sku: 'BW200', price: '52.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
    { id: VARIANT_IDS.BW_500G, productId: PRODUCT_IDS.BHAKARWADI, size: '500g', unit: 'packet', sku: 'BW500', price: '120.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },

    // ─── Corn Flakes Mixture ───────────────────────────────────────────────
    { id: VARIANT_IDS.CF_200G, productId: PRODUCT_IDS.CORN_FLAKES_MIX, size: '200g', unit: 'packet', sku: 'CF200', price: '32.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
    { id: VARIANT_IDS.CF_500G, productId: PRODUCT_IDS.CORN_FLAKES_MIX, size: '500g', unit: 'packet', sku: 'CF500', price: '75.00', createdAt: new Date('2026-05-02'), updatedAt: new Date('2026-05-02') },
  ];

  const { productVariants } = require('../schema');
  await db.insert(productVariants).values(variantsData);
  console.log(`  ✔ Product variants seeded (${variantsData.length} records)`);

  return VARIANT_IDS;
};

module.exports = { seedProductVariants, VARIANT_IDS };
