// shopAliases.seed.js — seeds 22 shop aliases.
//
// Aliases represent how salesmen naturally say shop names during voice ordering.
// The AI uses these to resolve "Sharma Ji" → "Sharma Kirana Store" (shopId).

const { SHOP_IDS } = require('./shops.seed');

const seedShopAliases = async (db) => {
  const aliasesData = [
    // Sharma Kirana Store aliases
    { shopId: SHOP_IDS.SHARMA_KIRANA, alias: 'Sharma Ji' },
    { shopId: SHOP_IDS.SHARMA_KIRANA, alias: 'Sharma Store' },
    { shopId: SHOP_IDS.SHARMA_KIRANA, alias: 'Sharma Bhaiya ki dukaan' },

    // Gupta General Store aliases
    { shopId: SHOP_IDS.GUPTA_GENERAL, alias: 'Gupta Ji' },
    { shopId: SHOP_IDS.GUPTA_GENERAL, alias: 'Gupta Store' },
    { shopId: SHOP_IDS.GUPTA_GENERAL, alias: 'Mahesh Bhai ki dukaan' },

    // Krishna Super Store aliases
    { shopId: SHOP_IDS.KRISHNA_SUPER, alias: 'Krishna Store' },
    { shopId: SHOP_IDS.KRISHNA_SUPER, alias: 'Suresh Bhai' },
    { shopId: SHOP_IDS.KRISHNA_SUPER, alias: 'Lajpat wala' },

    // Hari Om Retail aliases
    { shopId: SHOP_IDS.HARI_OM_RETAIL, alias: 'Hari Om Shop' },
    { shopId: SHOP_IDS.HARI_OM_RETAIL, alias: 'Hari Prasad Ji' },

    // Om Provision Store aliases
    { shopId: SHOP_IDS.OM_PROVISION, alias: 'Om Store' },
    { shopId: SHOP_IDS.OM_PROVISION, alias: 'Karol Bagh wala' },

    // Maa Durga Traders aliases
    { shopId: SHOP_IDS.MAA_DURGA, alias: 'Durga Store' },
    { shopId: SHOP_IDS.MAA_DURGA, alias: 'Dinesh Ji ki dukaan' },

    // Ganesh Departmental Store aliases
    { shopId: SHOP_IDS.GANESH_DEPT, alias: 'Ganesh Store' },
    { shopId: SHOP_IDS.GANESH_DEPT, alias: 'Nehru Place wala' },

    // Laxmi Kirana aliases
    { shopId: SHOP_IDS.LAXMI_KIRANA, alias: 'Laxmi Store' },
    { shopId: SHOP_IDS.LAXMI_KIRANA, alias: 'Faridabad wali dukaan' },

    // Shree Ram Traders aliases
    { shopId: SHOP_IDS.SHREE_RAM, alias: 'Shree Ram Store' },
    { shopId: SHOP_IDS.SHREE_RAM, alias: 'Ramkumar Ji' },

    // Bharat Provisions aliases
    { shopId: SHOP_IDS.BHARAT_PROVISIONS, alias: 'Bharat Store' },
    { shopId: SHOP_IDS.BHARAT_PROVISIONS, alias: 'Bharat Bhai' },
  ];

  const { shopAliases } = require('../schema');
  await db.insert(shopAliases).values(aliasesData);
  console.log(`  ✔ Shop aliases seeded (${aliasesData.length} records)`);
};

module.exports = { seedShopAliases };
