// productAliases.seed.js — seeds 25 product aliases.
//
// Aliases represent natural Hindi/Hinglish spoken names used during voice ordering.
// The AI uses these to resolve "bhujiya" → "Aloo Bhujia" (productId).

const { PRODUCT_IDS } = require('./products.seed');

const seedProductAliases = async (db) => {
  const aliasesData = [
    // Aloo Bhujia
    { productId: PRODUCT_IDS.ALOO_BHUJIA, alias: 'Bhujia' },
    { productId: PRODUCT_IDS.ALOO_BHUJIA, alias: 'Bhujiya' },
    { productId: PRODUCT_IDS.ALOO_BHUJIA, alias: 'Aloo Sev' },
    { productId: PRODUCT_IDS.ALOO_BHUJIA, alias: 'Aloo wala Namkeen' },

    // Sev
    { productId: PRODUCT_IDS.SEV, alias: 'Thin Sev' },
    { productId: PRODUCT_IDS.SEV, alias: 'Patla Sev' },
    { productId: PRODUCT_IDS.SEV, alias: 'Sev Namkeen' },

    // Mixture
    { productId: PRODUCT_IDS.MIXTURE, alias: 'Mix' },
    { productId: PRODUCT_IDS.MIXTURE, alias: 'Namkeen Mix' },
    { productId: PRODUCT_IDS.MIXTURE, alias: 'Mixture Namkeen' },

    // Moong Dal
    { productId: PRODUCT_IDS.MOONG_DAL, alias: 'Moong' },
    { productId: PRODUCT_IDS.MOONG_DAL, alias: 'Moong wali dal' },
    { productId: PRODUCT_IDS.MOONG_DAL, alias: 'Yellow Dal Namkeen' },

    // Chana Dal
    { productId: PRODUCT_IDS.CHANA_DAL, alias: 'Chana' },
    { productId: PRODUCT_IDS.CHANA_DAL, alias: 'Chana wali dal' },

    // Khatta Meetha Mix
    { productId: PRODUCT_IDS.KHATTA_MEETHA, alias: 'Khatta Meetha' },
    { productId: PRODUCT_IDS.KHATTA_MEETHA, alias: 'Meetha Mix' },

    // Masala Peanuts
    { productId: PRODUCT_IDS.MASALA_PEANUTS, alias: 'Masala Dana' },
    { productId: PRODUCT_IDS.MASALA_PEANUTS, alias: 'Spicy Mungfali' },
    { productId: PRODUCT_IDS.MASALA_PEANUTS, alias: 'Masala Mungfali' },

    // Salted Peanuts
    { productId: PRODUCT_IDS.SALTED_PEANUTS, alias: 'Salted Dana' },
    { productId: PRODUCT_IDS.SALTED_PEANUTS, alias: 'Namak wali Mungfali' },

    // Bhakarwadi
    { productId: PRODUCT_IDS.BHAKARWADI, alias: 'Bhakar' },
    { productId: PRODUCT_IDS.BHAKARWADI, alias: 'Chakri Namkeen' },

    // Corn Flakes Mixture
    { productId: PRODUCT_IDS.CORN_FLAKES_MIX, alias: 'Corn Mix' },
    { productId: PRODUCT_IDS.CORN_FLAKES_MIX, alias: 'Makka Mix' },
  ];

  const { productAliases } = require('../schema');
  await db.insert(productAliases).values(aliasesData);
  console.log(`  ✔ Product aliases seeded (${aliasesData.length} records)`);
};

module.exports = { seedProductAliases };
