import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  activitySeeds,
  businessSettingsSeed,
  categorySeeds,
  customerSeeds,
  employeeSeeds,
  inventoryMovementSeeds,
  orderItemSeeds,
  orderSeeds,
  productSeeds,
  repairSeeds
} from './data';

type SeedClient = PrismaClient;

export function normalizeSeedRequiredString(value: string): string {
  return value.trim();
}

export function normalizeSeedOptionalString(
  value: string | null | undefined
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
}

export async function seedDatabase(prisma: SeedClient): Promise<void> {
  // Rebuild the same mock rows that are visible in Musicshop.sql.
  await resetMockSeedData(prisma);
}

export async function resetMockSeedData(prisma: SeedClient): Promise<void> {
  await clearDatabase(prisma);
  await upsertMockSeedData(prisma);
}

export async function upsertMockSeedData(prisma: SeedClient): Promise<void> {
  await upsertSeedData(prisma);
}

async function clearDatabase(prisma: SeedClient): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.repairRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.businessSettings.deleteMany();
}

async function upsertSeedData(prisma: SeedClient): Promise<void> {
  await prisma.businessSettings.upsert({
    where: { id: businessSettingsSeed.id },
    create: businessSettingsSeed,
    update: {
      currency: businessSettingsSeed.currency,
      lowStockThreshold: businessSettingsSeed.lowStockThreshold,
      defaultProductStatus: businessSettingsSeed.defaultProductStatus,
      defaultMarkupPercent: businessSettingsSeed.defaultMarkupPercent,
      createdAt: businessSettingsSeed.createdAt,
      updatedAt: businessSettingsSeed.updatedAt
    }
  });

  for (const employee of employeeSeeds) {
    const employeePayload = await buildEmployeePayload(employee);
    await prisma.employee.upsert({
      where: { id: employee.id },
      create: {
        id: employee.id,
        ...employeePayload
      },
      update: employeePayload
    });
  }

  for (const customer of customerSeeds) {
    const customerPayload = await buildCustomerPayload(customer);
    await prisma.customer.upsert({
      where: { id: customer.id },
      create: {
        id: customer.id,
        ...customerPayload
      },
      update: customerPayload
    });
  }

  for (const category of categorySeeds) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        ...buildCategoryPayload(category)
      },
      update: buildCategoryPayload(category)
    });
  }

  for (const product of productSeeds) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        ...buildProductPayload(product)
      },
      update: buildProductPayload(product)
    });
  }

  for (const movement of inventoryMovementSeeds) {
    await prisma.inventoryMovement.upsert({
      where: { id: movement.id },
      create: {
        id: movement.id,
        ...buildInventoryMovementPayload(movement)
      },
      update: buildInventoryMovementPayload(movement)
    });
  }

  for (const order of orderSeeds) {
    await prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        ...buildOrderPayload(order)
      },
      update: buildOrderPayload(order)
    });
  }

  for (const item of orderItemSeeds) {
    await prisma.orderItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        ...buildOrderItemPayload(item)
      },
      update: buildOrderItemPayload(item)
    });
  }

  for (const repair of repairSeeds) {
    await prisma.repairRequest.upsert({
      where: { id: repair.id },
      create: {
        id: repair.id,
        ...buildRepairPayload(repair)
      },
      update: buildRepairPayload(repair)
    });
  }

  for (const activity of activitySeeds) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      create: {
        id: activity.id,
        ...buildActivityPayload(activity)
      },
      update: buildActivityPayload(activity)
    });
  }
}

async function buildEmployeePayload(employee: (typeof employeeSeeds)[number]) {
  return {
    name: normalizeSeedRequiredString(employee.name),
    login: normalizeSeedRequiredString(employee.login).toLowerCase(),
    email: normalizeSeedRequiredString(employee.email).toLowerCase(),
    phone: normalizeSeedRequiredString(employee.phone),
    role: employee.role,
    status: normalizeSeedRequiredString(employee.status),
    passwordHash: await bcrypt.hash(employee.plainPassword, 10),
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
  };
}

async function buildCustomerPayload(customer: (typeof customerSeeds)[number]) {
  return {
    name: normalizeSeedRequiredString(customer.name),
    fullName: normalizeSeedOptionalString(customer.fullName),
    phone: normalizeSeedRequiredString(customer.phone),
    email: normalizeSeedRequiredString(customer.email).toLowerCase(),
    tier: customer.tier,
    status: normalizeSeedRequiredString(customer.status),
    notes: normalizeSeedRequiredString(customer.notes),
    passwordHash: await bcrypt.hash(customer.plainPassword, 10),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
}

function buildCategoryPayload(category: (typeof categorySeeds)[number]) {
  return {
    name: normalizeSeedRequiredString(category.name),
    slug: category.slug,
    parentId: category.parentId,
    status: normalizeSeedRequiredString(category.status),
    description: normalizeSeedRequiredString(category.description),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}

function buildProductPayload(product: (typeof productSeeds)[number]) {
  return {
    name: normalizeSeedRequiredString(product.name),
    sku: normalizeSeedRequiredString(product.sku),
    barcode: normalizeSeedOptionalString(product.barcode) ?? null,
    categoryId: product.categoryId,
    brand: normalizeSeedRequiredString(product.brand),
    price: product.price,
    costPrice: product.costPrice,
    stockQty: product.stockQty,
    minStockQty: product.minStockQty,
    status: product.status,
    shortDescription: normalizeSeedRequiredString(product.shortDescription),
    description: normalizeSeedRequiredString(product.description),
    specs: product.specs,
    images: [...product.images],
    primaryImage: normalizeSeedOptionalString(product.primaryImage) ?? null,
    condition: product.condition,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

function buildInventoryMovementPayload(movement: (typeof inventoryMovementSeeds)[number]) {
  return {
    productId: movement.productId,
    delta: movement.delta,
    reason: normalizeSeedRequiredString(movement.reason),
    createdAt: movement.createdAt
  };
}

function buildOrderPayload(order: (typeof orderSeeds)[number]) {
  return {
    customerId: order.customerId,
    paymentStatus: order.paymentStatus,
    status: order.status,
    notes: normalizeSeedRequiredString(order.notes),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

function buildOrderItemPayload(item: (typeof orderItemSeeds)[number]) {
  return {
    orderId: item.orderId,
    productId: item.productId,
    qty: item.qty,
    unitPrice: item.unitPrice
  };
}

function buildRepairPayload(repair: (typeof repairSeeds)[number]) {
  return {
    customerId: repair.customerId,
    instrumentName: normalizeSeedRequiredString(repair.instrumentName),
    brand: normalizeSeedRequiredString(repair.brand),
    issue: normalizeSeedRequiredString(repair.issue),
    status: repair.status,
    notes: normalizeSeedRequiredString(repair.notes),
    estimatedCost: repair.estimatedCost,
    assignedMasterName: normalizeSeedOptionalString(repair.assignedMasterName) ?? null,
    receivedAt: repair.receivedAt,
    createdAt: repair.createdAt,
    updatedAt: repair.updatedAt
  };
}

function buildActivityPayload(activity: (typeof activitySeeds)[number]) {
  return {
    title: activity.title,
    messageKey: activity.messageKey,
    messageParams: activity.messageParams,
    timestamp: activity.timestamp
  };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const mode = process.argv.includes('--mode=upsert') ? 'upsert' : 'reset';

  try {
    if (mode === 'upsert') {
      await upsertMockSeedData(prisma);
      console.info('Mock database upsert seed completed.');
    } else {
      await seedDatabase(prisma);
      console.info('Mock database reset seed completed.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
