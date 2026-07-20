import {
  Condition,
  CustomerTier,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  RepairStatus,
  Role
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedDatabase(client: PrismaClient): Promise<void> {
  const adminPasswordHash = await bcrypt.hash('Secret!1', 10);
  const clientPasswordHash = await bcrypt.hash('amina@example.com', 10);

  await client.session.deleteMany();
  await client.activity.deleteMany();
  await client.orderItem.deleteMany();
  await client.order.deleteMany();
  await client.inventoryMovement.deleteMany();
  await client.repairRequest.deleteMany();
  await client.product.deleteMany();
  await client.category.deleteMany({
    where: {
      NOT: {
        parentId: null
      }
    }
  });
  await client.category.deleteMany({
    where: {
      parentId: null
    }
  });

  await client.businessSettings.upsert({
    where: { id: 'business-settings' },
    update: {
      currency: 'UZS',
      lowStockThreshold: 3,
      defaultProductStatus: ProductStatus.draft,
      defaultMarkupPercent: 28
    },
    create: {
      id: 'business-settings',
      currency: 'UZS',
      lowStockThreshold: 3,
      defaultProductStatus: ProductStatus.draft,
      defaultMarkupPercent: 28
    }
  });

  await client.employee.upsert({
    where: { email: 'admin@musicshop.local' },
    update: {
      name: 'Admin',
      login: 'admin',
      phone: '+998900000001',
      role: Role.admin,
      status: 'active',
      passwordHash: adminPasswordHash
    },
    create: {
      id: 'employee-admin',
      name: 'Admin',
      login: 'admin',
      email: 'admin@musicshop.local',
      phone: '+998900000001',
      role: Role.admin,
      status: 'active',
      passwordHash: adminPasswordHash
    }
  });

  await client.employee.upsert({
    where: { email: 'manager@musicshop.local' },
    update: {
      name: 'Operations Admin',
      login: 'manager',
      phone: '+998901112233',
      role: Role.admin,
      status: 'active',
      passwordHash: await bcrypt.hash('manager@musicshop.local', 10)
    },
    create: {
      id: 'employee-001',
      name: 'Operations Admin',
      login: 'manager',
      email: 'manager@musicshop.local',
      phone: '+998901112233',
      role: Role.admin,
      status: 'active',
      passwordHash: await bcrypt.hash('manager@musicshop.local', 10)
    }
  });

  await client.customer.upsert({
    where: { email: 'amina@example.com' },
    update: {
      name: 'Amina Karimova',
      fullName: 'Amina Karimova',
      phone: '+998901234567',
      tier: CustomerTier.vip,
      status: 'active',
      notes: 'Frequent keyboard buyer',
      passwordHash: clientPasswordHash
    },
    create: {
      id: 'customer-001',
      name: 'Amina Karimova',
      fullName: 'Amina Karimova',
      phone: '+998901234567',
      email: 'amina@example.com',
      tier: CustomerTier.vip,
      status: 'active',
      notes: 'Frequent keyboard buyer',
      passwordHash: clientPasswordHash
    }
  });

  await client.customer.upsert({
    where: { email: 'studio@example.com' },
    update: {
      name: 'Studio Buyer',
      fullName: 'Studio Buyer LLC',
      phone: '+998907654321',
      tier: CustomerTier.studio,
      status: 'active',
      notes: 'Bulk accessory orders',
      passwordHash: await bcrypt.hash('studio@example.com', 10)
    },
    create: {
      id: 'customer-002',
      name: 'Studio Buyer',
      fullName: 'Studio Buyer LLC',
      phone: '+998907654321',
      email: 'studio@example.com',
      tier: CustomerTier.studio,
      status: 'active',
      notes: 'Bulk accessory orders',
      passwordHash: await bcrypt.hash('studio@example.com', 10)
    }
  });

  await client.category.createMany({
    data: [
      {
        id: 'category-pianos',
        name: 'Digital Pianos',
        slug: 'pianos',
        parentId: null,
        status: 'active',
        description: 'Portable and stage pianos'
      },
      {
        id: 'category-guitars',
        name: 'Guitars',
        slug: 'guitars',
        parentId: null,
        status: 'active',
        description: 'Electric and acoustic guitars'
      }
    ],
    skipDuplicates: true
  });

  await client.product.createMany({
    data: [
      {
        id: 'product-player-strat',
        name: 'Fender Player Stratocaster',
        sku: 'FEN-STRAT-001',
        barcode: '1234567890123',
        categoryId: 'category-guitars',
        brand: 'Fender',
        price: 9800000,
        costPrice: 7600000,
        stockQty: 4,
        minStockQty: 2,
        status: ProductStatus.active,
        shortDescription: 'Versatile electric guitar',
        description: 'Full product description',
        specs: {
          Body: 'Alder',
          Neck: 'Maple'
        },
        images: ['/assets/fender-player-stratocaster.jpg'],
        primaryImage: '/assets/fender-player-stratocaster.jpg',
        condition: Condition.new
      },
      {
        id: 'product-yamaha-p125',
        name: 'Yamaha P-125',
        sku: 'YAM-P125-001',
        barcode: '3210987654321',
        categoryId: 'category-pianos',
        brand: 'Yamaha',
        price: 8700000,
        costPrice: 6900000,
        stockQty: 2,
        minStockQty: 1,
        status: ProductStatus.active,
        shortDescription: 'Portable stage piano',
        description: 'Weighted keys and compact body',
        specs: {
          Keys: '88',
          Action: 'GHS'
        },
        images: ['/assets/yamaha-p125.jpg'],
        primaryImage: '/assets/yamaha-p125.jpg',
        condition: Condition.new
      }
    ],
    skipDuplicates: true
  });

  await client.inventoryMovement.create({
    data: {
      id: 'movement-ord-1001-product-player-strat',
      productId: 'product-player-strat',
      delta: -1,
      reason: 'Reserved for client order ORD-1001',
      createdAt: new Date('2026-07-09T10:00:00.000Z')
    }
  });

  await client.order.create({
    data: {
      id: 'ORD-1001',
      customerId: 'customer-001',
      paymentStatus: PaymentStatus.pending,
      status: OrderStatus.confirmed,
      notes: 'Please confirm pickup time.',
      createdAt: new Date('2026-07-09T10:00:00.000Z'),
      updatedAt: new Date('2026-07-09T10:05:00.000Z'),
      items: {
        create: {
          id: 'order-item-ord-1001-product-player-strat',
          productId: 'product-player-strat',
          qty: 1,
          unitPrice: 9800000
        }
      }
    }
  });

  await client.repairRequest.create({
    data: {
      id: 'REP-2001',
      customerId: 'customer-001',
      instrumentName: 'Yamaha P-125',
      brand: 'Yamaha',
      issue: 'Keys have uneven velocity response.',
      status: RepairStatus.new,
      notes: 'Unit is still powering on.',
      estimatedCost: 350000,
      assignedMasterName: 'Akmal R.',
      receivedAt: new Date('2026-07-08T00:00:00.000Z'),
      createdAt: new Date('2026-07-09T10:00:00.000Z'),
      updatedAt: new Date('2026-07-09T10:00:00.000Z')
    }
  });

  await client.activity.create({
    data: {
      id: 'activity-order-ord-1001',
      title: 'activity.orderMoved',
      messageKey: 'activity.orderMoved',
      messageParams: {
        orderId: 'ORD-1001',
        status: 'confirmed'
      },
      timestamp: new Date('2026-07-09T10:00:00.000Z')
    }
  });
}

async function main(): Promise<void> {
  await seedDatabase(prisma);
}

if (require.main === module) {
  main()
    .catch(async (error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
