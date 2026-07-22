import { RepairStatus } from '@prisma/client';

export const repairSeeds = [
  {
    id: 'REP-2001',
    customerId: 'customer-001',
    instrumentName: 'Yamaha P-125',
    brand: 'Yamaha',
    issue: 'Keys have uneven velocity response.',
    status: RepairStatus.new,
    notes: 'Unit is still powering on.',
    estimatedCost: 350_000,
    assignedMasterName: 'Akmal R.',
    receivedAt: new Date('2026-07-08T00:00:00.000Z'),
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'REP-2002',
    customerId: 'customer-004',
    instrumentName: 'Fender Player Stratocaster',
    brand: 'Fender',
    issue: 'Output jack cuts out intermittently.',
    status: RepairStatus.diagnostics,
    notes: 'Customer requested quick estimate.',
    estimatedCost: 180_000,
    assignedMasterName: 'Sardor K.',
    receivedAt: new Date('2026-07-12T09:00:00.000Z'),
    createdAt: new Date('2026-07-12T10:30:00.000Z'),
    updatedAt: new Date('2026-07-12T12:00:00.000Z')
  },
  {
    id: 'REP-2003',
    customerId: 'customer-007',
    instrumentName: 'Kawai ES110',
    brand: 'Kawai',
    issue: 'Sustain pedal response is inconsistent.',
    status: RepairStatus.ready,
    notes: 'Waiting for customer pickup confirmation.',
    estimatedCost: 220_000,
    assignedMasterName: 'Akmal R.',
    receivedAt: new Date('2026-07-14T11:00:00.000Z'),
    createdAt: new Date('2026-07-14T11:30:00.000Z'),
    updatedAt: new Date('2026-07-15T15:00:00.000Z')
  },
  {
    id: 'REP-2004',
    customerId: 'customer-008',
    instrumentName: 'Gibson Les Paul Studio',
    brand: 'Gibson',
    issue: 'Needs fret polishing and setup.',
    status: RepairStatus.completed,
    notes: 'Completed before weekend session.',
    estimatedCost: 400_000,
    assignedMasterName: 'Bekzod U.',
    receivedAt: new Date('2026-07-16T10:00:00.000Z'),
    createdAt: new Date('2026-07-16T10:20:00.000Z'),
    updatedAt: new Date('2026-07-17T18:00:00.000Z')
  },
  {
    id: 'REP-2005',
    customerId: 'customer-010',
    instrumentName: 'Yamaha P-125',
    brand: 'Yamaha',
    issue: 'Middle register has a rattling key.',
    status: RepairStatus.in_progress,
    notes: 'Parts ordered for keybed inspection.',
    estimatedCost: 310_000,
    assignedMasterName: 'Dilshod M.',
    receivedAt: new Date('2026-07-17T08:30:00.000Z'),
    createdAt: new Date('2026-07-17T09:00:00.000Z'),
    updatedAt: new Date('2026-07-18T14:45:00.000Z')
  }
] as const;
