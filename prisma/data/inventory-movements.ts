import { InventoryMovementType } from '@prisma/client';

export const inventoryMovementSeeds = [
  {
    id: 'movement-ord-1001-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1001',
    referenceType: 'order',
    referenceId: 'ORD-1001',
    createdAt: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'movement-ord-1002-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1002',
    referenceType: 'order',
    referenceId: 'ORD-1002',
    createdAt: new Date('2026-07-10T11:30:00.000Z')
  },
  {
    id: 'movement-ord-1003-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    type: InventoryMovementType.ship,
    reason: 'Shipped for client order ORD-1003',
    referenceType: 'order',
    referenceId: 'ORD-1003',
    createdAt: new Date('2026-07-12T15:10:00.000Z')
  },
  {
    id: 'movement-ord-1004-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1004',
    referenceType: 'order',
    referenceId: 'ORD-1004',
    createdAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'movement-ord-1005-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1005',
    referenceType: 'order',
    referenceId: 'ORD-1005',
    createdAt: new Date('2026-07-16T14:20:00.000Z')
  },
  {
    id: 'movement-ord-1006-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1006',
    referenceType: 'order',
    referenceId: 'ORD-1006',
    createdAt: new Date('2026-07-18T12:00:00.000Z')
  },
  {
    id: 'movement-ord-1007-product-casio-ct-s1',
    productId: 'product-casio-ct-s1',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1007',
    referenceType: 'order',
    referenceId: 'ORD-1007',
    createdAt: new Date('2026-07-21T10:40:00.000Z')
  },
  {
    id: 'movement-ord-1007-product-yamaha-yas-280',
    productId: 'product-yamaha-yas-280',
    delta: -1,
    type: InventoryMovementType.reserve,
    reason: 'Reserved for client order ORD-1007',
    referenceType: 'order',
    referenceId: 'ORD-1007',
    createdAt: new Date('2026-07-21T10:40:00.000Z')
  },
  {
    id: 'movement-refund-ord-1007-product-casio-ct-s1',
    productId: 'product-casio-ct-s1',
    delta: 1,
    type: InventoryMovementType.release,
    reason: 'Restocked after refund for ORD-1007',
    referenceType: 'order',
    referenceId: 'ORD-1007',
    createdAt: new Date('2026-07-21T12:10:00.000Z')
  },
  {
    id: 'movement-refund-ord-1007-product-yamaha-yas-280',
    productId: 'product-yamaha-yas-280',
    delta: 1,
    type: InventoryMovementType.release,
    reason: 'Restocked after refund for ORD-1007',
    referenceType: 'order',
    referenceId: 'ORD-1007',
    createdAt: new Date('2026-07-21T12:10:00.000Z')
  },
  {
    id: 'movement-restock-product-shure-sm7b',
    productId: 'product-shure-sm7b',
    delta: 3,
    type: InventoryMovementType.manual_adjustment,
    reason: 'Weekly restock from distributor intake',
    referenceType: null,
    referenceId: null,
    createdAt: new Date('2026-07-21T09:00:00.000Z')
  },
  {
    id: 'movement-audit-product-roland-spd-sx',
    productId: 'product-roland-spd-sx',
    delta: -1,
    type: InventoryMovementType.manual_adjustment,
    reason: 'Showroom audit adjustment after display handoff',
    referenceType: null,
    referenceId: null,
    createdAt: new Date('2026-07-21T11:15:00.000Z')
  }
] as const;
