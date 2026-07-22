export const inventoryMovementSeeds = [
  {
    id: 'movement-ord-1001-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    reason: 'Reserved for client order ORD-1001',
    createdAt: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'movement-ord-1002-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    reason: 'Reserved for client order ORD-1002',
    createdAt: new Date('2026-07-10T11:30:00.000Z')
  },
  {
    id: 'movement-ord-1003-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    reason: 'Reserved for client order ORD-1003',
    createdAt: new Date('2026-07-12T15:10:00.000Z')
  },
  {
    id: 'movement-ord-1004-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    reason: 'Reserved for client order ORD-1004',
    createdAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'movement-ord-1005-product-player-strat',
    productId: 'product-player-strat',
    delta: -1,
    reason: 'Reserved for client order ORD-1005',
    createdAt: new Date('2026-07-16T14:20:00.000Z')
  },
  {
    id: 'movement-ord-1006-product-yamaha-p125',
    productId: 'product-yamaha-p125',
    delta: -1,
    reason: 'Reserved for client order ORD-1006',
    createdAt: new Date('2026-07-18T12:00:00.000Z')
  },
  {
    id: 'movement-restock-product-shure-sm7b',
    productId: 'product-shure-sm7b',
    delta: 3,
    reason: 'Weekly restock from distributor intake',
    createdAt: new Date('2026-07-21T09:00:00.000Z')
  },
  {
    id: 'movement-audit-product-roland-spd-sx',
    productId: 'product-roland-spd-sx',
    delta: -1,
    reason: 'Showroom audit adjustment after display handoff',
    createdAt: new Date('2026-07-21T11:15:00.000Z')
  }
] as const;
