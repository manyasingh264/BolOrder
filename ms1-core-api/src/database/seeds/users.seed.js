// users.seed.js — seeds 10 factory employees.
//
// Roles: 1 ADMIN, 1 SUPERVISOR, 8 SALESMAN
// Password for all users: Password@123
//
// IDs are hardcoded so other seed files can reference them safely.

const bcrypt = require('bcryptjs');

// ─── Fixed UUIDs ──────────────────────────────────────────────────────────────
// Using readable UUIDs (10-prefix = users) makes debugging easy.
const USER_IDS = {
  ADMIN:      '10000000-0000-0000-0000-000000000001',
  SUPERVISOR: '10000000-0000-0000-0000-000000000002',
  SALESMAN_1: '10000000-0000-0000-0000-000000000003', // Raj Verma
  SALESMAN_2: '10000000-0000-0000-0000-000000000004', // Sunil Yadav
  SALESMAN_3: '10000000-0000-0000-0000-000000000005', // Kavita Joshi
  SALESMAN_4: '10000000-0000-0000-0000-000000000006', // Deepak Gupta
  SALESMAN_5: '10000000-0000-0000-0000-000000000007', // Anita Patel
  SALESMAN_6: '10000000-0000-0000-0000-000000000008', // Mohit Sharma
  SALESMAN_7: '10000000-0000-0000-0000-000000000009', // Rekha Singh
  SALESMAN_8: '10000000-0000-0000-0000-000000000010', // Vijay Kumar
};

const seedUsers = async (db) => {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const usersData = [
    {
      id:           USER_IDS.ADMIN,
      name:         'Arjun Mehta',
      email:        'arjun.mehta@vofm.com',
      phone:        '9810012345',
      passwordHash: passwordHash,
      role:         'ADMIN',
      isActive:     true,
      createdAt:    new Date('2026-05-01'),
      updatedAt:    new Date('2026-05-01'),
    },
    {
      id:           USER_IDS.SUPERVISOR,
      name:         'Priya Sharma',
      email:        'priya.sharma@vofm.com',
      phone:        '9811023456',
      passwordHash: passwordHash,
      role:         'SUPERVISOR',
      isActive:     true,
      createdAt:    new Date('2026-05-01'),
      updatedAt:    new Date('2026-05-01'),
    },
    {
      id:           USER_IDS.SALESMAN_1,
      name:         'Raj Verma',
      email:        'raj.verma@vofm.com',
      phone:        '9812034567',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-05'),
      updatedAt:    new Date('2026-05-05'),
    },
    {
      id:           USER_IDS.SALESMAN_2,
      name:         'Sunil Yadav',
      email:        'sunil.yadav@vofm.com',
      phone:        '9813045678',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-05'),
      updatedAt:    new Date('2026-05-05'),
    },
    {
      id:           USER_IDS.SALESMAN_3,
      name:         'Kavita Joshi',
      email:        'kavita.joshi@vofm.com',
      phone:        '9814056789',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-08'),
      updatedAt:    new Date('2026-05-08'),
    },
    {
      id:           USER_IDS.SALESMAN_4,
      name:         'Deepak Gupta',
      email:        'deepak.gupta@vofm.com',
      phone:        '9815067890',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-08'),
      updatedAt:    new Date('2026-05-08'),
    },
    {
      id:           USER_IDS.SALESMAN_5,
      name:         'Anita Patel',
      email:        'anita.patel@vofm.com',
      phone:        '9816078901',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-10'),
      updatedAt:    new Date('2026-05-10'),
    },
    {
      id:           USER_IDS.SALESMAN_6,
      name:         'Mohit Sharma',
      email:        'mohit.sharma@vofm.com',
      phone:        '9817089012',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-10'),
      updatedAt:    new Date('2026-05-10'),
    },
    {
      id:           USER_IDS.SALESMAN_7,
      name:         'Rekha Singh',
      email:        'rekha.singh@vofm.com',
      phone:        '9818090123',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-12'),
      updatedAt:    new Date('2026-05-12'),
    },
    {
      id:           USER_IDS.SALESMAN_8,
      name:         'Vijay Kumar',
      email:        'vijay.kumar@vofm.com',
      phone:        '9819001234',
      passwordHash: passwordHash,
      role:         'SALESMAN',
      isActive:     true,
      createdAt:    new Date('2026-05-12'),
      updatedAt:    new Date('2026-05-12'),
    },
  ];

  const { users } = require('../schema');
  await db.insert(users).values(usersData);
  console.log(`  ✔ Users seeded (${usersData.length} records)`);

  return USER_IDS;
};

module.exports = { seedUsers, USER_IDS };
