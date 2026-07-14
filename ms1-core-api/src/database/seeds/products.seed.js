// products.seed.js — seeds 10 namkeen products.
//
// All products belong to a single namkeen factory.
// Categories: Bhujia, Mixture, Dal Snacks, Peanuts, Traditional Snacks

// ─── Fixed UUIDs (30-prefix = products) ──────────────────────────────────────
const PRODUCT_IDS = {
  ALOO_BHUJIA:      '30000000-0000-0000-0000-000000000001',
  SEV:              '30000000-0000-0000-0000-000000000002',
  MIXTURE:          '30000000-0000-0000-0000-000000000003',
  MOONG_DAL:        '30000000-0000-0000-0000-000000000004',
  CHANA_DAL:        '30000000-0000-0000-0000-000000000005',
  KHATTA_MEETHA:    '30000000-0000-0000-0000-000000000006',
  MASALA_PEANUTS:   '30000000-0000-0000-0000-000000000007',
  SALTED_PEANUTS:   '30000000-0000-0000-0000-000000000008',
  BHAKARWADI:       '30000000-0000-0000-0000-000000000009',
  CORN_FLAKES_MIX:  '30000000-0000-0000-0000-000000000010',
};

const seedProducts = async (db) => {
  const productsData = [
    {
      id:          PRODUCT_IDS.ALOO_BHUJIA,
      name:        'Aloo Bhujia',
      category:    'Bhujia',
      description: 'Crispy potato bhujia with a perfect blend of spices. Factory bestseller.',
      isActive:    true,
      createdAt:   new Date('2026-05-01'),
      updatedAt:   new Date('2026-05-01'),
    },
    {
      id:          PRODUCT_IDS.SEV,
      name:        'Sev',
      category:    'Bhujia',
      description: 'Fine gram flour sev with mild spices. Available in regular and thin variants.',
      isActive:    true,
      createdAt:   new Date('2026-05-01'),
      updatedAt:   new Date('2026-05-01'),
    },
    {
      id:          PRODUCT_IDS.MIXTURE,
      name:        'Mixture',
      category:    'Mixture',
      description: 'Classic Indian namkeen mixture with sev, peanuts, and spiced flattened rice.',
      isActive:    true,
      createdAt:   new Date('2026-05-01'),
      updatedAt:   new Date('2026-05-01'),
    },
    {
      id:          PRODUCT_IDS.MOONG_DAL,
      name:        'Moong Dal',
      category:    'Dal Snacks',
      description: 'Crispy fried moong dal snack, lightly salted and flavoured with cumin.',
      isActive:    true,
      createdAt:   new Date('2026-05-01'),
      updatedAt:   new Date('2026-05-01'),
    },
    {
      id:          PRODUCT_IDS.CHANA_DAL,
      name:        'Chana Dal',
      category:    'Dal Snacks',
      description: 'Roasted and fried chana dal with a crunchy texture and mild spice.',
      isActive:    true,
      createdAt:   new Date('2026-05-01'),
      updatedAt:   new Date('2026-05-01'),
    },
    {
      id:          PRODUCT_IDS.KHATTA_MEETHA,
      name:        'Khatta Meetha Mix',
      category:    'Mixture',
      description: 'Tangy and sweet namkeen mix with sev, poha, and dried fruits.',
      isActive:    true,
      createdAt:   new Date('2026-05-02'),
      updatedAt:   new Date('2026-05-02'),
    },
    {
      id:          PRODUCT_IDS.MASALA_PEANUTS,
      name:        'Masala Peanuts',
      category:    'Peanuts',
      description: 'Crunchy peanuts coated with a spicy masala blend. High protein snack.',
      isActive:    true,
      createdAt:   new Date('2026-05-02'),
      updatedAt:   new Date('2026-05-02'),
    },
    {
      id:          PRODUCT_IDS.SALTED_PEANUTS,
      name:        'Salted Peanuts',
      category:    'Peanuts',
      description: 'Classic salted peanuts roasted in factory with pure oil.',
      isActive:    true,
      createdAt:   new Date('2026-05-02'),
      updatedAt:   new Date('2026-05-02'),
    },
    {
      id:          PRODUCT_IDS.BHAKARWADI,
      name:        'Bhakarwadi',
      category:    'Traditional Snacks',
      description: 'Traditional spiral snack with sweet, spicy, and tangy filling. Popular in Maharashtra.',
      isActive:    true,
      createdAt:   new Date('2026-05-02'),
      updatedAt:   new Date('2026-05-02'),
    },
    {
      id:          PRODUCT_IDS.CORN_FLAKES_MIX,
      name:        'Corn Flakes Mixture',
      category:    'Mixture',
      description: 'Light and crispy mixture made with corn flakes, sev, and roasted nuts.',
      isActive:    true,
      createdAt:   new Date('2026-05-02'),
      updatedAt:   new Date('2026-05-02'),
    },
  ];

  const { products } = require('../schema');
  await db.insert(products).values(productsData);
  console.log(`  ✔ Products seeded (${productsData.length} records)`);

  return PRODUCT_IDS;
};

module.exports = { seedProducts, PRODUCT_IDS };
