import { Role } from '@prisma/client';

export const employeeSeeds = [
  {
    id: 'employee-admin',
    name: 'Admin',
    login: 'admin',
    email: 'admin@musicshop.local',
    phone: '+998900000001',
    role: Role.admin,
    status: 'active',
    plainPassword: 'Secret!1',
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'employee-001',
    name: 'Operations Admin',
    login: 'manager',
    email: 'manager@musicshop.local',
    phone: '+998901112233',
    role: Role.admin,
    status: 'active',
    plainPassword: 'manager@musicshop.local',
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'employee-002',
    name: 'Sales Floor Lead',
    login: 'sales.lead',
    email: 'sales.lead@musicshop.local',
    phone: '+998901112244',
    role: Role.admin,
    status: 'active',
    plainPassword: 'sales.lead@musicshop.local',
    createdAt: new Date('2026-07-10T09:00:00.000Z'),
    updatedAt: new Date('2026-07-10T09:00:00.000Z')
  },
  {
    id: 'employee-003',
    name: 'Repair Coordinator',
    login: 'repair.coordinator',
    email: 'repair.coordinator@musicshop.local',
    phone: '+998901112255',
    role: Role.admin,
    status: 'active',
    plainPassword: 'repair.coordinator@musicshop.local',
    createdAt: new Date('2026-07-10T09:30:00.000Z'),
    updatedAt: new Date('2026-07-10T09:30:00.000Z')
  },
  {
    id: 'employee-004',
    name: 'Finance Desk',
    login: 'finance.desk',
    email: 'finance.desk@musicshop.local',
    phone: '+998901112266',
    role: Role.admin,
    status: 'active',
    plainPassword: 'finance.desk@musicshop.local',
    createdAt: new Date('2026-07-11T08:45:00.000Z'),
    updatedAt: new Date('2026-07-11T08:45:00.000Z')
  },
  {
    id: 'employee-005',
    name: 'Weekend Visual Merchandiser',
    login: 'visual.merch',
    email: 'visual.merch@musicshop.local',
    phone: '+998901112277',
    role: Role.admin,
    status: 'inactive',
    plainPassword: 'visual.merch@musicshop.local',
    createdAt: new Date('2026-07-12T11:00:00.000Z'),
    updatedAt: new Date('2026-07-12T11:00:00.000Z')
  }
] as const;
