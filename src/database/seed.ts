import * as bcrypt from "bcrypt";
import "dotenv/config";
import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import {
  activitySeeds,
  businessSettingsSeed,
  categorySeeds,
  customerSeeds,
  deliverySeeds,
  employeeSeeds,
  inventoryMovementSeeds,
  orderItemSeeds,
  orderSeeds,
  orderStatusHistorySeeds,
  packagingDetailSeeds,
  paymentSeeds,
  productSeeds,
  repairSeeds,
} from "./seed-data";
import {
  ActivityEntity,
  BusinessSettingsEntity,
  CategoryEntity,
  CustomerEntity,
  DeliveryEntity,
  EmployeeEntity,
  InventoryMovementEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatusHistoryEntity,
  PackagingDetailEntity,
  PaymentEntity,
  ProductEntity,
  RepairRequestEntity,
  SessionEntity,
} from "./entities";
import AppDataSource from "./typeorm.datasource";

type SeedClient = DataSource | EntityManager;

export function normalizeSeedRequiredString(value: string): string {
  return value.trim();
}

export function normalizeSeedOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

export async function seedDatabase(client: SeedClient): Promise<void> {
  await resetMockSeedData(client);
}

export async function resetMockSeedData(client: SeedClient): Promise<void> {
  await clearDatabase(client);
  await upsertMockSeedData(client);
}

export async function upsertMockSeedData(client: SeedClient): Promise<void> {
  await upsertSeedData(client);
}

async function clearDatabase(client: SeedClient): Promise<void> {
  await deleteAll(client, SessionEntity);
  await deleteAll(client, OrderStatusHistoryEntity);
  await deleteAll(client, PaymentEntity);
  await deleteAll(client, DeliveryEntity);
  await deleteAll(client, PackagingDetailEntity);
  await deleteAll(client, OrderItemEntity);
  await deleteAll(client, InventoryMovementEntity);
  await deleteAll(client, RepairRequestEntity);
  await deleteAll(client, OrderEntity);
  await deleteAll(client, ProductEntity);
  await deleteAll(client, CategoryEntity);
  await deleteAll(client, CustomerEntity);
  await deleteAll(client, EmployeeEntity);
  await deleteAll(client, ActivityEntity);
  await deleteAll(client, BusinessSettingsEntity);
}

async function deleteAll<TEntity extends ObjectLiteral>(
  client: SeedClient,
  entity: EntityTarget<TEntity>,
): Promise<void> {
  await getRepository(client, entity)
    .createQueryBuilder()
    .delete()
    .from(entity)
    .execute();
}

function getRepository<TEntity extends ObjectLiteral>(
  client: SeedClient,
  entity: EntityTarget<TEntity>,
): Repository<TEntity> {
  return client.getRepository(entity);
}

async function upsertSeedData(client: SeedClient): Promise<void> {
  await getRepository(client, BusinessSettingsEntity).upsert(
    {
      ...businessSettingsSeed,
    },
    ["id"],
  );

  for (const employee of employeeSeeds) {
    const employeePayload = await buildEmployeePayload(employee);
    await getRepository(client, EmployeeEntity).upsert(
      {
        id: employee.id,
        ...employeePayload,
      },
      ["id"],
    );
  }

  for (const customer of customerSeeds) {
    const customerPayload = await buildCustomerPayload(customer);
    await getRepository(client, CustomerEntity).upsert(
      {
        id: customer.id,
        ...customerPayload,
      },
      ["id"],
    );
  }

  for (const category of categorySeeds) {
    await getRepository(client, CategoryEntity).upsert(
      {
        id: category.id,
        ...buildCategoryPayload(category),
      },
      ["id"],
    );
  }

  for (const product of productSeeds) {
    await getRepository(client, ProductEntity).upsert(
      {
        id: product.id,
        ...buildProductPayload(product),
      },
      ["id"],
    );
  }

  for (const movement of inventoryMovementSeeds) {
    await getRepository(client, InventoryMovementEntity).upsert(
      {
        id: movement.id,
        ...buildInventoryMovementPayload(movement),
      },
      ["id"],
    );
  }

  for (const order of orderSeeds) {
    await getRepository(client, OrderEntity).upsert(
      {
        id: order.id,
        ...buildOrderPayload(order),
      },
      ["id"],
    );
  }

  for (const item of orderItemSeeds) {
    await getRepository(client, OrderItemEntity).upsert(
      {
        id: item.id,
        ...buildOrderItemPayload(item),
      },
      ["id"],
    );
  }

  for (const payment of paymentSeeds) {
    await getRepository(client, PaymentEntity).upsert(
      {
        id: payment.id,
        ...buildPaymentPayload(payment),
      },
      ["id"],
    );
  }

  for (const delivery of deliverySeeds) {
    await getRepository(client, DeliveryEntity).upsert(
      {
        id: delivery.id,
        ...buildDeliveryPayload(delivery),
      },
      ["orderId"],
    );
  }

  for (const packagingDetail of packagingDetailSeeds) {
    await getRepository(client, PackagingDetailEntity).upsert(
      {
        id: packagingDetail.id,
        ...buildPackagingDetailPayload(packagingDetail),
      },
      ["orderId"],
    );
  }

  for (const historyEntry of orderStatusHistorySeeds) {
    await getRepository(client, OrderStatusHistoryEntity).upsert(
      {
        id: historyEntry.id,
        ...buildOrderStatusHistoryPayload(historyEntry),
      },
      ["id"],
    );
  }

  for (const repair of repairSeeds) {
    await getRepository(client, RepairRequestEntity).upsert(
      {
        id: repair.id,
        ...buildRepairPayload(repair),
      },
      ["id"],
    );
  }

  for (const activity of activitySeeds) {
    await getRepository(client, ActivityEntity).upsert(
      {
        id: activity.id,
        ...buildActivityPayload(activity),
      },
      ["id"],
    );
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
    updatedAt: employee.updatedAt,
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
    updatedAt: customer.updatedAt,
  };
}

function buildCategoryPayload(category: (typeof categorySeeds)[number]) {
  return {
    name: normalizeSeedRequiredString(category.name),
    slug: category.slug,
    parentId: category.parentId,
    image: normalizeSeedRequiredString(category.image),
    status: normalizeSeedRequiredString(category.status),
    description: normalizeSeedRequiredString(category.description),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
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
    reservedQty: "reservedQty" in product ? product.reservedQty : 0,
    slug: product.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    minStockQty: product.minStockQty,
    status: product.status,
    shortDescription: normalizeSeedRequiredString(product.shortDescription),
    description: normalizeSeedRequiredString(product.description),
    specs: product.specs,
    images: [...product.images],
    primaryImage: normalizeSeedOptionalString(product.primaryImage) ?? null,
    condition: product.condition,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function buildInventoryMovementPayload(
  movement: (typeof inventoryMovementSeeds)[number],
) {
  return {
    productId: movement.productId,
    delta: movement.delta,
    type: movement.type,
    reason: normalizeSeedRequiredString(movement.reason),
    referenceType: normalizeSeedOptionalString(movement.referenceType) ?? null,
    referenceId: normalizeSeedOptionalString(movement.referenceId) ?? null,
    createdAt: movement.createdAt,
  };
}

function buildOrderPayload(order: (typeof orderSeeds)[number]) {
  return {
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerNameSnapshot: order.customerNameSnapshot,
    phoneSnapshot: order.phoneSnapshot,
    emailSnapshot: order.emailSnapshot,
    deliveryAddressSnapshot: order.deliveryAddressSnapshot,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    deliveryMethod: order.deliveryMethod,
    status: order.status,
    notes: normalizeSeedRequiredString(order.notes),
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function buildOrderItemPayload(item: (typeof orderItemSeeds)[number]) {
  return {
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  };
}

function buildPaymentPayload(payment: (typeof paymentSeeds)[number]) {
  return {
    orderId: payment.orderId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    transactionId: normalizeSeedOptionalString(payment.transactionId) ?? null,
    provider: normalizeSeedOptionalString(payment.provider) ?? null,
    providerPayload: payment.providerPayload ?? null,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

function buildDeliveryPayload(delivery: (typeof deliverySeeds)[number]) {
  return {
    orderId: delivery.orderId,
    method: delivery.method,
    company: normalizeSeedOptionalString(delivery.company) ?? null,
    address: normalizeSeedRequiredString(delivery.address),
    trackingNumber:
      normalizeSeedOptionalString(delivery.trackingNumber) ?? null,
    shippingCost: delivery.shippingCost,
    status: delivery.status,
    shippedAt: delivery.shippedAt,
    deliveredAt: delivery.deliveredAt,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

function buildPackagingDetailPayload(
  packagingDetail: (typeof packagingDetailSeeds)[number],
) {
  return {
    orderId: packagingDetail.orderId,
    status: packagingDetail.status,
    packedAt: packagingDetail.packedAt,
    employeeId: normalizeSeedOptionalString(packagingDetail.employeeId) ?? null,
    weightGrams: packagingDetail.weightGrams,
    dimensions: normalizeSeedOptionalString(packagingDetail.dimensions) ?? null,
    fragile: packagingDetail.fragile,
    packageType:
      normalizeSeedOptionalString(packagingDetail.packageType) ?? null,
    comment: normalizeSeedOptionalString(packagingDetail.comment) ?? null,
    createdAt: packagingDetail.createdAt,
    updatedAt: packagingDetail.updatedAt,
  };
}

function buildOrderStatusHistoryPayload(
  historyEntry: (typeof orderStatusHistorySeeds)[number],
) {
  return {
    orderId: historyEntry.orderId,
    oldStatus: historyEntry.oldStatus,
    newStatus: historyEntry.newStatus,
    changedByType: historyEntry.changedByType,
    changedById: normalizeSeedOptionalString(historyEntry.changedById) ?? null,
    comment: normalizeSeedOptionalString(historyEntry.comment) ?? null,
    changedAt: historyEntry.changedAt,
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
    assignedMasterName:
      normalizeSeedOptionalString(repair.assignedMasterName) ?? null,
    receivedAt: repair.receivedAt,
    createdAt: repair.createdAt,
    updatedAt: repair.updatedAt,
  };
}

function buildActivityPayload(activity: (typeof activitySeeds)[number]) {
  return {
    title: activity.title,
    messageKey: activity.messageKey,
    messageParams: activity.messageParams,
    timestamp: activity.timestamp,
  };
}

async function main(): Promise<void> {
  const mode = process.argv.includes("--mode=upsert") ? "upsert" : "reset";
  const dataSource = AppDataSource;

  await dataSource.initialize();

  try {
    if (mode === "upsert") {
      await upsertMockSeedData(dataSource);
      console.info("Mock database upsert seed completed.");
    } else {
      await seedDatabase(dataSource);
      console.info("Mock database reset seed completed.");
    }
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void main();
}
