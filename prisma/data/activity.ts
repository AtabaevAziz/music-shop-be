export const activitySeeds = [
  {
    id: 'activity-order-ord-1001',
    title: 'activity.orderMoved',
    messageKey: 'activity.orderMoved',
    messageParams: {
      orderId: 'ORD-1001',
      status: 'confirmed'
    },
    timestamp: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'activity-repair-created-rep-2001',
    title: 'activity.repairCreated',
    messageKey: 'activity.repairCreated',
    messageParams: {
      repairId: 'REP-2001',
      customerId: 'customer-001'
    },
    timestamp: new Date('2026-07-09T10:00:00.000Z')
  },
  {
    id: 'activity-order-created-ord-1002',
    title: 'activity.orderCreated',
    messageKey: 'activity.orderCreated',
    messageParams: {
      orderId: 'ORD-1002',
      customerId: 'customer-002'
    },
    timestamp: new Date('2026-07-10T11:30:00.000Z')
  },
  {
    id: 'activity-order-created-ord-1003',
    title: 'activity.orderCreated',
    messageKey: 'activity.orderCreated',
    messageParams: {
      orderId: 'ORD-1003',
      customerId: 'customer-004'
    },
    timestamp: new Date('2026-07-12T15:10:00.000Z')
  },
  {
    id: 'activity-repair-created-rep-2002',
    title: 'activity.repairCreated',
    messageKey: 'activity.repairCreated',
    messageParams: {
      repairId: 'REP-2002',
      customerId: 'customer-004'
    },
    timestamp: new Date('2026-07-12T10:30:00.000Z')
  },
  {
    id: 'activity-order-created-ord-1004',
    title: 'activity.orderCreated',
    messageKey: 'activity.orderCreated',
    messageParams: {
      orderId: 'ORD-1004',
      customerId: 'customer-006'
    },
    timestamp: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'activity-repair-created-rep-2003',
    title: 'activity.repairCreated',
    messageKey: 'activity.repairCreated',
    messageParams: {
      repairId: 'REP-2003',
      customerId: 'customer-007'
    },
    timestamp: new Date('2026-07-14T11:30:00.000Z')
  },
  {
    id: 'activity-order-created-ord-1005',
    title: 'activity.orderCreated',
    messageKey: 'activity.orderCreated',
    messageParams: {
      orderId: 'ORD-1005',
      customerId: 'customer-008'
    },
    timestamp: new Date('2026-07-16T14:20:00.000Z')
  },
  {
    id: 'activity-repair-created-rep-2004',
    title: 'activity.repairCreated',
    messageKey: 'activity.repairCreated',
    messageParams: {
      repairId: 'REP-2004',
      customerId: 'customer-008'
    },
    timestamp: new Date('2026-07-16T10:20:00.000Z')
  },
  {
    id: 'activity-repair-created-rep-2005',
    title: 'activity.repairCreated',
    messageKey: 'activity.repairCreated',
    messageParams: {
      repairId: 'REP-2005',
      customerId: 'customer-010'
    },
    timestamp: new Date('2026-07-17T09:00:00.000Z')
  },
  {
    id: 'activity-order-created-ord-1006',
    title: 'activity.orderCreated',
    messageKey: 'activity.orderCreated',
    messageParams: {
      orderId: 'ORD-1006',
      customerId: 'customer-009'
    },
    timestamp: new Date('2026-07-18T12:00:00.000Z')
  },
  {
    id: 'activity-inventory-restock-product-shure-sm7b',
    title: 'activity.inventoryAdjusted',
    messageKey: 'activity.inventoryAdjusted',
    messageParams: {
      productId: 'product-shure-sm7b',
      delta: 3
    },
    timestamp: new Date('2026-07-21T09:00:00.000Z')
  },
  {
    id: 'activity-inventory-audit-product-roland-spd-sx',
    title: 'activity.inventoryAdjusted',
    messageKey: 'activity.inventoryAdjusted',
    messageParams: {
      productId: 'product-roland-spd-sx',
      delta: -1
    },
    timestamp: new Date('2026-07-21T11:15:00.000Z')
  }
] as const;
