import {
  ActorType,
  DeliveryStatus,
  OrderStatus,
  PackagingStatus,
  PaymentStatus
} from '@prisma/client';

export const orderSeeds = [
  {
    id: 'ORD-1001',
    orderNumber: 'ORD-1001',
    customerId: 'customer-001',
    customerNameSnapshot: 'Aziz Atabayev',
    phoneSnapshot: '+998901110101',
    emailSnapshot: 'aziz@example.com',
    deliveryAddressSnapshot: 'Tashkent, Yunusabad district',
    paymentMethod: 'cash',
    paymentStatus: PaymentStatus.pending,
    deliveryMethod: 'pickup',
    status: OrderStatus.confirmed,
    notes: 'Please confirm pickup time.',
    subtotal: 9_800_000,
    deliveryCost: 0,
    total: 9_800_000,
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'ORD-1002',
    orderNumber: 'ORD-1002',
    customerId: 'customer-002',
    customerNameSnapshot: 'Studio Vibe',
    phoneSnapshot: '+998901110202',
    emailSnapshot: 'studio@example.com',
    deliveryAddressSnapshot: 'Tashkent, Chilanzar district',
    paymentMethod: 'online',
    paymentStatus: PaymentStatus.paid,
    deliveryMethod: 'courier',
    status: OrderStatus.packed,
    notes: 'Bulk stand order for rehearsal room.',
    subtotal: 8_700_000,
    deliveryCost: 50_000,
    total: 8_750_000,
    createdAt: new Date('2026-07-10T11:30:00.000Z'),
    updatedAt: new Date('2026-07-10T13:00:00.000Z')
  },
  {
    id: 'ORD-1003',
    orderNumber: 'ORD-1003',
    customerId: 'customer-004',
    customerNameSnapshot: 'Nodir Karimov',
    phoneSnapshot: '+998901110404',
    emailSnapshot: 'nodir@example.com',
    deliveryAddressSnapshot: 'Tashkent, Mirzo-Ulugbek district',
    paymentMethod: 'cash',
    paymentStatus: PaymentStatus.paid,
    deliveryMethod: 'pickup',
    status: OrderStatus.delivered,
    notes: 'VIP pickup completed from showroom floor.',
    subtotal: 9_800_000,
    deliveryCost: 0,
    total: 9_800_000,
    createdAt: new Date('2026-07-12T15:10:00.000Z'),
    updatedAt: new Date('2026-07-12T17:45:00.000Z')
  },
  {
    id: 'ORD-1004',
    orderNumber: 'ORD-1004',
    customerId: 'customer-006',
    customerNameSnapshot: 'School Procurement',
    phoneSnapshot: '+998901110606',
    emailSnapshot: 'school@example.com',
    deliveryAddressSnapshot: 'Tashkent region',
    paymentMethod: 'cash',
    paymentStatus: PaymentStatus.pending,
    deliveryMethod: 'delivery_company',
    status: OrderStatus.new,
    notes: 'School procurement pending director approval.',
    subtotal: 8_700_000,
    deliveryCost: 90_000,
    total: 8_790_000,
    createdAt: new Date('2026-07-13T09:15:00.000Z'),
    updatedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'ORD-1005',
    orderNumber: 'ORD-1005',
    customerId: 'customer-008',
    customerNameSnapshot: 'Soundcheck Team',
    phoneSnapshot: '+998901110808',
    emailSnapshot: 'soundcheck@example.com',
    deliveryAddressSnapshot: 'Tashkent, backstage pickup',
    paymentMethod: 'online',
    paymentStatus: PaymentStatus.paid,
    deliveryMethod: 'pickup',
    status: OrderStatus.packing,
    notes: 'Hold until evening soundcheck pickup.',
    subtotal: 9_800_000,
    deliveryCost: 0,
    total: 9_800_000,
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    updatedAt: new Date('2026-07-16T16:05:00.000Z')
  },
  {
    id: 'ORD-1006',
    orderNumber: 'ORD-1006',
    customerId: 'customer-009',
    customerNameSnapshot: 'Bekzod Tursunov',
    phoneSnapshot: '+998901110909',
    emailSnapshot: 'bekzod@example.com',
    deliveryAddressSnapshot: 'Tashkent, Sergeli district',
    paymentMethod: 'cash',
    paymentStatus: PaymentStatus.pending,
    deliveryMethod: 'courier',
    status: OrderStatus.confirmed,
    notes: 'Requested invoice copy by email.',
    subtotal: 8_700_000,
    deliveryCost: 50_000,
    total: 8_750_000,
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:25:00.000Z')
  },
  {
    id: 'ORD-1007',
    orderNumber: 'ORD-1007',
    customerId: 'customer-003',
    customerNameSnapshot: 'Madinabonu Alimova',
    phoneSnapshot: '+998901110303',
    emailSnapshot: 'madina@example.com',
    deliveryAddressSnapshot: 'Samarkand city',
    paymentMethod: 'online',
    paymentStatus: PaymentStatus.refunded,
    deliveryMethod: 'post',
    status: OrderStatus.cancelled,
    notes: 'Customer cancelled after refund was issued for a duplicated checkout attempt.',
    subtotal: 12_500_000,
    deliveryCost: 70_000,
    total: 12_570_000,
    createdAt: new Date('2026-07-21T10:40:00.000Z'),
    updatedAt: new Date('2026-07-21T12:10:00.000Z')
  }
] as const;

export const orderItemSeeds = [
  {
    id: 'order-item-ord-1001-product-player-strat',
    orderId: 'ORD-1001',
    productId: 'product-player-strat',
    productName: 'Fender Player Stratocaster',
    quantity: 1,
    unitPrice: 9_800_000,
    totalPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1002-product-yamaha-p125',
    orderId: 'ORD-1002',
    productId: 'product-yamaha-p125',
    productName: 'Yamaha P-125',
    quantity: 1,
    unitPrice: 8_700_000,
    totalPrice: 8_700_000
  },
  {
    id: 'order-item-ord-1003-product-player-strat',
    orderId: 'ORD-1003',
    productId: 'product-player-strat',
    productName: 'Fender Player Stratocaster',
    quantity: 1,
    unitPrice: 9_800_000,
    totalPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1004-product-yamaha-p125',
    orderId: 'ORD-1004',
    productId: 'product-yamaha-p125',
    productName: 'Yamaha P-125',
    quantity: 1,
    unitPrice: 8_700_000,
    totalPrice: 8_700_000
  },
  {
    id: 'order-item-ord-1005-product-player-strat',
    orderId: 'ORD-1005',
    productId: 'product-player-strat',
    productName: 'Fender Player Stratocaster',
    quantity: 1,
    unitPrice: 9_800_000,
    totalPrice: 9_800_000
  },
  {
    id: 'order-item-ord-1006-product-yamaha-p125',
    orderId: 'ORD-1006',
    productId: 'product-yamaha-p125',
    productName: 'Yamaha P-125',
    quantity: 1,
    unitPrice: 8_700_000,
    totalPrice: 8_700_000
  },
  {
    id: 'order-item-ord-1007-product-casio-ct-s1',
    orderId: 'ORD-1007',
    productId: 'product-casio-ct-s1',
    productName: 'Casio CT-S1',
    quantity: 1,
    unitPrice: 3_600_000,
    totalPrice: 3_600_000
  },
  {
    id: 'order-item-ord-1007-product-yamaha-yas-280',
    orderId: 'ORD-1007',
    productId: 'product-yamaha-yas-280',
    productName: 'Yamaha YAS-280',
    quantity: 1,
    unitPrice: 8_900_000,
    totalPrice: 8_900_000
  }
] as const;

export const paymentSeeds = [
  {
    id: 'payment-ord-1001',
    orderId: 'ORD-1001',
    method: 'cash',
    status: PaymentStatus.pending,
    amount: 9_800_000,
    transactionId: null,
    provider: null,
    providerPayload: null,
    paidAt: null,
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'payment-ord-1002',
    orderId: 'ORD-1002',
    method: 'online',
    status: PaymentStatus.paid,
    amount: 8_750_000,
    transactionId: 'stub-ord-1002',
    provider: 'stub-gateway',
    providerPayload: {
      gateway: 'stub-gateway',
      settled: true
    },
    paidAt: new Date('2026-07-10T11:45:00.000Z'),
    createdAt: new Date('2026-07-10T11:30:00.000Z'),
    updatedAt: new Date('2026-07-10T11:45:00.000Z')
  },
  {
    id: 'payment-ord-1003',
    orderId: 'ORD-1003',
    method: 'cash',
    status: PaymentStatus.paid,
    amount: 9_800_000,
    transactionId: 'cash-ord-1003',
    provider: 'cash-desk',
    providerPayload: null,
    paidAt: new Date('2026-07-12T15:20:00.000Z'),
    createdAt: new Date('2026-07-12T15:10:00.000Z'),
    updatedAt: new Date('2026-07-12T15:20:00.000Z')
  },
  {
    id: 'payment-ord-1004',
    orderId: 'ORD-1004',
    method: 'cash',
    status: PaymentStatus.pending,
    amount: 8_790_000,
    transactionId: null,
    provider: null,
    providerPayload: null,
    paidAt: null,
    createdAt: new Date('2026-07-13T09:15:00.000Z'),
    updatedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'payment-ord-1005',
    orderId: 'ORD-1005',
    method: 'online',
    status: PaymentStatus.paid,
    amount: 9_800_000,
    transactionId: 'stub-ord-1005',
    provider: 'stub-gateway',
    providerPayload: {
      gateway: 'stub-gateway',
      settled: true
    },
    paidAt: new Date('2026-07-16T14:35:00.000Z'),
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    updatedAt: new Date('2026-07-16T14:35:00.000Z')
  },
  {
    id: 'payment-ord-1006',
    orderId: 'ORD-1006',
    method: 'cash',
    status: PaymentStatus.pending,
    amount: 8_750_000,
    transactionId: null,
    provider: null,
    providerPayload: null,
    paidAt: null,
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:25:00.000Z')
  },
  {
    id: 'payment-ord-1007',
    orderId: 'ORD-1007',
    method: 'online',
    status: PaymentStatus.refunded,
    amount: 12_570_000,
    transactionId: 'stub-ord-1007-refund',
    provider: 'stub-gateway',
    providerPayload: {
      gateway: 'stub-gateway',
      refunded: true
    },
    paidAt: new Date('2026-07-21T10:45:00.000Z'),
    createdAt: new Date('2026-07-21T10:40:00.000Z'),
    updatedAt: new Date('2026-07-21T12:10:00.000Z')
  }
] as const;

export const deliverySeeds = [
  {
    id: 'delivery-ord-1001',
    orderId: 'ORD-1001',
    method: 'pickup',
    company: null,
    address: 'Tashkent, Yunusabad district',
    trackingNumber: null,
    shippingCost: 0,
    status: DeliveryStatus.not_ready,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'delivery-ord-1002',
    orderId: 'ORD-1002',
    method: 'courier',
    company: 'Tashkent Express',
    address: 'Tashkent, Chilanzar district',
    trackingNumber: null,
    shippingCost: 50_000,
    status: DeliveryStatus.ready_for_shipment,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-10T11:30:00.000Z'),
    updatedAt: new Date('2026-07-10T13:00:00.000Z')
  },
  {
    id: 'delivery-ord-1003',
    orderId: 'ORD-1003',
    method: 'pickup',
    company: null,
    address: 'Tashkent, Mirzo-Ulugbek district',
    trackingNumber: 'pickup-ord-1003',
    shippingCost: 0,
    status: DeliveryStatus.delivered,
    shippedAt: new Date('2026-07-12T16:30:00.000Z'),
    deliveredAt: new Date('2026-07-12T17:45:00.000Z'),
    createdAt: new Date('2026-07-12T15:10:00.000Z'),
    updatedAt: new Date('2026-07-12T17:45:00.000Z')
  },
  {
    id: 'delivery-ord-1004',
    orderId: 'ORD-1004',
    method: 'delivery_company',
    company: 'Uz Logistics',
    address: 'Tashkent region',
    trackingNumber: null,
    shippingCost: 90_000,
    status: DeliveryStatus.not_ready,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-13T09:15:00.000Z'),
    updatedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'delivery-ord-1005',
    orderId: 'ORD-1005',
    method: 'pickup',
    company: null,
    address: 'Tashkent, backstage pickup',
    trackingNumber: null,
    shippingCost: 0,
    status: DeliveryStatus.not_ready,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    updatedAt: new Date('2026-07-16T16:05:00.000Z')
  },
  {
    id: 'delivery-ord-1006',
    orderId: 'ORD-1006',
    method: 'courier',
    company: 'Tashkent Express',
    address: 'Tashkent, Sergeli district',
    trackingNumber: null,
    shippingCost: 50_000,
    status: DeliveryStatus.not_ready,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:25:00.000Z')
  },
  {
    id: 'delivery-ord-1007',
    orderId: 'ORD-1007',
    method: 'post',
    company: 'UzPost',
    address: 'Samarkand city',
    trackingNumber: null,
    shippingCost: 70_000,
    status: DeliveryStatus.not_ready,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date('2026-07-21T10:40:00.000Z'),
    updatedAt: new Date('2026-07-21T12:10:00.000Z')
  }
] as const;

export const packagingDetailSeeds = [
  {
    id: 'packaging-ord-1001',
    orderId: 'ORD-1001',
    status: PackagingStatus.not_started,
    packedAt: null,
    employeeId: null,
    weightGrams: null,
    dimensions: null,
    fragile: false,
    packageType: null,
    comment: null,
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    updatedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'packaging-ord-1002',
    orderId: 'ORD-1002',
    status: PackagingStatus.packed,
    packedAt: new Date('2026-07-10T12:55:00.000Z'),
    employeeId: 'employee-002',
    weightGrams: 13200,
    dimensions: '130x42x18 cm',
    fragile: true,
    packageType: 'reinforced keyboard carton',
    comment: 'Bulk stand bundle secured for courier handoff.',
    createdAt: new Date('2026-07-10T11:30:00.000Z'),
    updatedAt: new Date('2026-07-10T13:00:00.000Z')
  },
  {
    id: 'packaging-ord-1003',
    orderId: 'ORD-1003',
    status: PackagingStatus.packed,
    packedAt: new Date('2026-07-12T16:15:00.000Z'),
    employeeId: 'employee-002',
    weightGrams: 4200,
    dimensions: '112x38x11 cm',
    fragile: false,
    packageType: 'showroom soft wrap',
    comment: 'Prepared for VIP pickup from showroom floor.',
    createdAt: new Date('2026-07-12T15:10:00.000Z'),
    updatedAt: new Date('2026-07-12T17:45:00.000Z')
  },
  {
    id: 'packaging-ord-1004',
    orderId: 'ORD-1004',
    status: PackagingStatus.not_started,
    packedAt: null,
    employeeId: null,
    weightGrams: null,
    dimensions: null,
    fragile: false,
    packageType: null,
    comment: 'Waiting for school approval before warehouse prep.',
    createdAt: new Date('2026-07-13T09:15:00.000Z'),
    updatedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'packaging-ord-1005',
    orderId: 'ORD-1005',
    status: PackagingStatus.in_progress,
    packedAt: null,
    employeeId: 'employee-002',
    weightGrams: null,
    dimensions: null,
    fragile: false,
    packageType: 'pickup hold',
    comment: 'Packaging staged for evening pickup window.',
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    updatedAt: new Date('2026-07-16T16:05:00.000Z')
  },
  {
    id: 'packaging-ord-1006',
    orderId: 'ORD-1006',
    status: PackagingStatus.not_started,
    packedAt: null,
    employeeId: null,
    weightGrams: null,
    dimensions: null,
    fragile: false,
    packageType: null,
    comment: 'Awaiting courier slot confirmation.',
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
    updatedAt: new Date('2026-07-18T12:25:00.000Z')
  },
  {
    id: 'packaging-ord-1007',
    orderId: 'ORD-1007',
    status: PackagingStatus.not_started,
    packedAt: null,
    employeeId: null,
    weightGrams: null,
    dimensions: null,
    fragile: false,
    packageType: null,
    comment: 'Checkout voided before packaging began.',
    createdAt: new Date('2026-07-21T10:40:00.000Z'),
    updatedAt: new Date('2026-07-21T12:10:00.000Z')
  }
] as const;

export const orderStatusHistorySeeds = [
  {
    id: 'status-history-ord-1001-confirmed',
    orderId: 'ORD-1001',
    oldStatus: OrderStatus.new,
    newStatus: OrderStatus.confirmed,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'Pickup time confirmed with customer.',
    changedAt: new Date('2026-07-09T10:05:00.000Z')
  },
  {
    id: 'status-history-ord-1002-awaiting-payment',
    orderId: 'ORD-1002',
    oldStatus: null,
    newStatus: OrderStatus.new,
    changedByType: ActorType.system,
    changedById: null,
    comment: 'Online checkout created.',
    changedAt: new Date('2026-07-10T11:30:00.000Z')
  },
  {
    id: 'status-history-ord-1002-confirmed',
    orderId: 'ORD-1002',
    oldStatus: OrderStatus.new,
    newStatus: OrderStatus.confirmed,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'Operations approved bulk courier order.',
    changedAt: new Date('2026-07-10T12:15:00.000Z')
  },
  {
    id: 'status-history-ord-1002-processing',
    orderId: 'ORD-1002',
    oldStatus: OrderStatus.confirmed,
    newStatus: OrderStatus.packing,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Warehouse started item prep.',
    changedAt: new Date('2026-07-10T12:30:00.000Z')
  },
  {
    id: 'status-history-ord-1002-packed',
    orderId: 'ORD-1002',
    oldStatus: OrderStatus.packing,
    newStatus: OrderStatus.packed,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Courier package packed and staged.',
    changedAt: new Date('2026-07-10T13:00:00.000Z')
  },
  {
    id: 'status-history-ord-1003-confirmed',
    orderId: 'ORD-1003',
    oldStatus: null,
    newStatus: OrderStatus.confirmed,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'VIP pickup confirmed at sales desk.',
    changedAt: new Date('2026-07-12T15:10:00.000Z')
  },
  {
    id: 'status-history-ord-1003-processing',
    orderId: 'ORD-1003',
    oldStatus: OrderStatus.confirmed,
    newStatus: OrderStatus.packing,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Showroom prep started.',
    changedAt: new Date('2026-07-12T15:30:00.000Z')
  },
  {
    id: 'status-history-ord-1003-packed',
    orderId: 'ORD-1003',
    oldStatus: OrderStatus.packing,
    newStatus: OrderStatus.packed,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Instrument wrapped for pickup.',
    changedAt: new Date('2026-07-12T16:15:00.000Z')
  },
  {
    id: 'status-history-ord-1003-shipped',
    orderId: 'ORD-1003',
    oldStatus: OrderStatus.packed,
    newStatus: OrderStatus.shipped,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Marked as handed over for pickup completion.',
    changedAt: new Date('2026-07-12T16:30:00.000Z')
  },
  {
    id: 'status-history-ord-1003-delivered',
    orderId: 'ORD-1003',
    oldStatus: OrderStatus.shipped,
    newStatus: OrderStatus.delivered,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'Customer collected instrument.',
    changedAt: new Date('2026-07-12T17:45:00.000Z')
  },
  {
    id: 'status-history-ord-1004-new',
    orderId: 'ORD-1004',
    oldStatus: null,
    newStatus: OrderStatus.new,
    changedByType: ActorType.system,
    changedById: null,
    comment: 'School procurement draft converted to order.',
    changedAt: new Date('2026-07-13T09:15:00.000Z')
  },
  {
    id: 'status-history-ord-1005-awaiting-payment',
    orderId: 'ORD-1005',
    oldStatus: null,
    newStatus: OrderStatus.new,
    changedByType: ActorType.system,
    changedById: null,
    comment: 'Online checkout created.',
    changedAt: new Date('2026-07-16T14:20:00.000Z')
  },
  {
    id: 'status-history-ord-1005-confirmed',
    orderId: 'ORD-1005',
    oldStatus: OrderStatus.new,
    newStatus: OrderStatus.confirmed,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'Evening pickup approved.',
    changedAt: new Date('2026-07-16T15:00:00.000Z')
  },
  {
    id: 'status-history-ord-1005-processing',
    orderId: 'ORD-1005',
    oldStatus: OrderStatus.confirmed,
    newStatus: OrderStatus.packing,
    changedByType: ActorType.employee,
    changedById: 'employee-002',
    comment: 'Stage pickup order being prepared.',
    changedAt: new Date('2026-07-16T16:05:00.000Z')
  },
  {
    id: 'status-history-ord-1006-confirmed',
    orderId: 'ORD-1006',
    oldStatus: OrderStatus.new,
    newStatus: OrderStatus.confirmed,
    changedByType: ActorType.employee,
    changedById: 'employee-001',
    comment: 'Invoice request acknowledged.',
    changedAt: new Date('2026-07-18T12:25:00.000Z')
  },
  {
    id: 'status-history-ord-1007-awaiting-payment',
    orderId: 'ORD-1007',
    oldStatus: null,
    newStatus: OrderStatus.new,
    changedByType: ActorType.system,
    changedById: null,
    comment: 'Online checkout created.',
    changedAt: new Date('2026-07-21T10:40:00.000Z')
  },
  {
    id: 'status-history-ord-1007-cancelled',
    orderId: 'ORD-1007',
    oldStatus: OrderStatus.new,
    newStatus: OrderStatus.cancelled,
    changedByType: ActorType.employee,
    changedById: 'employee-004',
    comment: 'Refund issued for duplicated checkout attempt.',
    changedAt: new Date('2026-07-21T12:10:00.000Z')
  }
] as const;
