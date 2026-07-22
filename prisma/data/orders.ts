import { OrderStatus, PaymentStatus } from '@prisma/client';

export const orderSeeds = [
  {
    id: 'ORD-1001',
    customerId: 'customer-001',
    paymentStatus: PaymentStatus.pending,
    status: OrderStatus.confirmed,
    notes: 'Please confirm pickup time.',
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'ORD-1002',
    customerId: 'customer-002',
    paymentStatus: PaymentStatus.partial,
    status: OrderStatus.packed,
    notes: 'Bulk stand order for rehearsal room.',
    createdAt: new Date('2026-07-10T11:30:00.000Z'),
    updatedAt: new Date('2026-07-10T13:00:00.000Z')
  },
  {
    id: 'ORD-1003',
    customerId: 'customer-004',
    paymentStatus: PaymentStatus.paid,
    status: OrderStatus.completed,
    notes: 'VIP pickup completed from showroom floor.',
    createdAt: new Date('2026-07-12T15:10:00.000Z'),
    updatedAt: new Date('2026-07-12T17:45:00.000Z')
  },
  {
    id: 'ORD-1004',
    customerId: 'customer-006',
    paymentStatus: PaymentStatus.pending,
    status: OrderStatus.new,
    notes: 'School procurement pending director approval.',
    createdAt: new Date('2026-07-13T09:15:00.000Z'),
    updatedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'ORD-1005',
    customerId: 'customer-008',
    paymentStatus: PaymentStatus.paid,
    status: OrderStatus.ready_for_pickup,
    notes: 'Hold until evening soundcheck pickup.',
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    updatedAt: new Date('2026-07-16T16:05:00.000Z')
  },
  {
    id: 'ORD-1006',
    customerId: 'customer-009',
    paymentStatus: PaymentStatus.pending,
    status: OrderStatus.confirmed,
    notes: 'Requested invoice copy by email.',
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:25:00.000Z')
  }
] as const;

export const orderItemSeeds = [
  {
    id: 'order-item-ord-1001-product-player-strat',
    orderId: 'ORD-1001',
    productId: 'product-player-strat',
    qty: 1,
    unitPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1002-product-yamaha-p125',
    orderId: 'ORD-1002',
    productId: 'product-yamaha-p125',
    qty: 1,
    unitPrice: 8_700_000
  },
  {
    id: 'order-item-ord-1003-product-player-strat',
    orderId: 'ORD-1003',
    productId: 'product-player-strat',
    qty: 1,
    unitPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1004-product-yamaha-p125',
    orderId: 'ORD-1004',
    productId: 'product-yamaha-p125',
    qty: 1,
    unitPrice: 8_700_000
  },
  {
    id: 'order-item-ord-1005-product-player-strat',
    orderId: 'ORD-1005',
    productId: 'product-player-strat',
    qty: 1,
    unitPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1006-product-yamaha-p125',
    orderId: 'ORD-1006',
    productId: 'product-yamaha-p125',
    qty: 1,
    unitPrice: 8_700_000
  }
] as const;
