// shops.seed.js — seeds 10 customer shops.
//
// Every shop is assigned to one SALESMAN.
// Raj Verma and Sunil Yadav each manage 2 shops.
// All other salesmen manage 1 shop each.

const { USER_IDS } = require('./users.seed');

// ─── Fixed UUIDs (20-prefix = shops) ─────────────────────────────────────────
const SHOP_IDS = {
  SHARMA_KIRANA:     '20000000-0000-0000-0000-000000000001',
  GUPTA_GENERAL:     '20000000-0000-0000-0000-000000000002',
  KRISHNA_SUPER:     '20000000-0000-0000-0000-000000000003',
  HARI_OM_RETAIL:    '20000000-0000-0000-0000-000000000004',
  OM_PROVISION:      '20000000-0000-0000-0000-000000000005',
  MAA_DURGA:         '20000000-0000-0000-0000-000000000006',
  GANESH_DEPT:       '20000000-0000-0000-0000-000000000007',
  LAXMI_KIRANA:      '20000000-0000-0000-0000-000000000008',
  SHREE_RAM:         '20000000-0000-0000-0000-000000000009',
  BHARAT_PROVISIONS: '20000000-0000-0000-0000-000000000010',
};

const seedShops = async (db) => {
  const shopsData = [
    // Raj Verma's shops (SALESMAN_1)
    {
      id:        SHOP_IDS.SHARMA_KIRANA,
      shopName:  'Sharma Kirana Store',
      ownerName: 'Ramesh Sharma',
      phone:     '9870011001',
      address:   'Shop No. 4, Gandhi Market, Sector 12, Noida',
      salesmanId: USER_IDS.SALESMAN_1,
      createdAt: new Date('2026-05-15'),
      updatedAt: new Date('2026-05-15'),
    },
    {
      id:        SHOP_IDS.GUPTA_GENERAL,
      shopName:  'Gupta General Store',
      ownerName: 'Mahesh Gupta',
      phone:     '9870022002',
      address:   'Near Bus Stand, Sector 18, Noida',
      salesmanId: USER_IDS.SALESMAN_1,
      createdAt: new Date('2026-05-15'),
      updatedAt: new Date('2026-05-15'),
    },

    // Sunil Yadav's shops (SALESMAN_2)
    {
      id:        SHOP_IDS.KRISHNA_SUPER,
      shopName:  'Krishna Super Store',
      ownerName: 'Suresh Mishra',
      phone:     '9870033003',
      address:   'Main Road, Lajpat Nagar, Delhi',
      salesmanId: USER_IDS.SALESMAN_2,
      createdAt: new Date('2026-05-16'),
      updatedAt: new Date('2026-05-16'),
    },
    {
      id:        SHOP_IDS.HARI_OM_RETAIL,
      shopName:  'Hari Om Retail',
      ownerName: 'Hari Prasad Yadav',
      phone:     '9870044004',
      address:   'Plot 7, Vikas Marg, Ghaziabad',
      salesmanId: USER_IDS.SALESMAN_2,
      createdAt: new Date('2026-05-16'),
      updatedAt: new Date('2026-05-16'),
    },

    // Kavita Joshi's shop (SALESMAN_3)
    {
      id:        SHOP_IDS.OM_PROVISION,
      shopName:  'Om Provision Store',
      ownerName: 'Om Prakash Jha',
      phone:     '9870055005',
      address:   'Karol Bagh Market, New Delhi',
      salesmanId: USER_IDS.SALESMAN_3,
      createdAt: new Date('2026-05-18'),
      updatedAt: new Date('2026-05-18'),
    },

    // Deepak Gupta's shop (SALESMAN_4)
    {
      id:        SHOP_IDS.MAA_DURGA,
      shopName:  'Maa Durga Traders',
      ownerName: 'Dinesh Agarwal',
      phone:     '9870066006',
      address:   'Sarojini Nagar, New Delhi',
      salesmanId: USER_IDS.SALESMAN_4,
      createdAt: new Date('2026-05-18'),
      updatedAt: new Date('2026-05-18'),
    },

    // Anita Patel's shop (SALESMAN_5)
    {
      id:        SHOP_IDS.GANESH_DEPT,
      shopName:  'Ganesh Departmental Store',
      ownerName: 'Ganesh Prasad',
      phone:     '9870077007',
      address:   'Nehru Place Market, New Delhi',
      salesmanId: USER_IDS.SALESMAN_5,
      createdAt: new Date('2026-05-20'),
      updatedAt: new Date('2026-05-20'),
    },

    // Mohit Sharma's shop (SALESMAN_6)
    {
      id:        SHOP_IDS.LAXMI_KIRANA,
      shopName:  'Laxmi Kirana',
      ownerName: 'Laxmi Devi',
      phone:     '9870088008',
      address:   'Old Market, Faridabad, Haryana',
      salesmanId: USER_IDS.SALESMAN_6,
      createdAt: new Date('2026-05-20'),
      updatedAt: new Date('2026-05-20'),
    },

    // Rekha Singh's shop (SALESMAN_7)
    {
      id:        SHOP_IDS.SHREE_RAM,
      shopName:  'Shree Ram Traders',
      ownerName: 'Ramkumar Tiwari',
      phone:     '9870099009',
      address:   'Patel Nagar, New Delhi',
      salesmanId: USER_IDS.SALESMAN_7,
      createdAt: new Date('2026-05-22'),
      updatedAt: new Date('2026-05-22'),
    },

    // Vijay Kumar's shop (SALESMAN_8)
    {
      id:        SHOP_IDS.BHARAT_PROVISIONS,
      shopName:  'Bharat Provisions',
      ownerName: 'Bharat Bhushan',
      phone:     '9870000010',
      address:   'Uttam Nagar, New Delhi',
      salesmanId: USER_IDS.SALESMAN_8,
      createdAt: new Date('2026-05-22'),
      updatedAt: new Date('2026-05-22'),
    },
  ];

  const { customerShops } = require('../schema');
  await db.insert(customerShops).values(shopsData);
  console.log(`  ✔ Shops seeded (${shopsData.length} records)`);

  return SHOP_IDS;
};

module.exports = { seedShops, SHOP_IDS };
