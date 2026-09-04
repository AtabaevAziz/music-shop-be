import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialTypeormSchema20260904000000 implements MigrationInterface {
  name = "InitialTypeormSchema20260904000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "Role" AS ENUM ('admin', 'client');
      CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');
      CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded');
      CREATE TYPE "OrderStatus" AS ENUM (
        'new',
        'confirmed',
        'sent_to_warehouse',
        'picking',
        'picked',
        'packing',
        'packed',
        'ready_for_shipment',
        'shipped',
        'delivered',
        'cancelled',
        'stock_problem',
        'returned'
      );
      CREATE TYPE "RepairStatus" AS ENUM ('new', 'diagnostics', 'in_progress', 'ready', 'completed', 'cancelled');
      CREATE TYPE "Condition" AS ENUM ('new', 'used', 'showroom');
      CREATE TYPE "PrincipalType" AS ENUM ('employee', 'customer');
      CREATE TYPE "CustomerTier" AS ENUM ('standard', 'studio', 'vip');
      CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'online');
      CREATE TYPE "DeliveryMethod" AS ENUM ('pickup', 'courier', 'delivery_company', 'post');
      CREATE TYPE "DeliveryStatus" AS ENUM ('not_ready', 'ready_for_shipment', 'shipped', 'in_transit', 'delivered', 'delivery_failed', 'returned');
      CREATE TYPE "PackagingStatus" AS ENUM ('not_started', 'in_progress', 'packed', 'ready_for_shipment');
      CREATE TYPE "InventoryMovementType" AS ENUM ('reserve', 'release', 'ship', 'manual_adjustment');
      CREATE TYPE "ActorType" AS ENUM ('system', 'employee', 'customer');

      CREATE TABLE "Employee" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "login" TEXT,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "status" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Employee_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Employee_login_key" UNIQUE ("login"),
        CONSTRAINT "Employee_email_key" UNIQUE ("email")
      );

      CREATE TABLE "Customer" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "fullName" TEXT,
        "phone" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "tier" "CustomerTier" NOT NULL,
        "status" TEXT NOT NULL,
        "notes" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Customer_email_key" UNIQUE ("email")
      );

      CREATE TABLE "Session" (
        "id" TEXT NOT NULL,
        "principalType" "PrincipalType" NOT NULL,
        "employeeId" TEXT,
        "customerId" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "Category" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "parentId" TEXT,
        "image" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Category_slug_key" UNIQUE ("slug")
      );

      CREATE TABLE "Product" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT,
        "sku" TEXT NOT NULL,
        "barcode" TEXT,
        "categoryId" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "costPrice" INTEGER NOT NULL,
        "stockQty" INTEGER NOT NULL,
        "reservedQty" INTEGER NOT NULL DEFAULT 0,
        "minStockQty" INTEGER,
        "status" "ProductStatus" NOT NULL,
        "shortDescription" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "specs" JSONB NOT NULL,
        "images" TEXT[] NOT NULL,
        "primaryImage" TEXT,
        "condition" "Condition" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Product_slug_key" UNIQUE ("slug"),
        CONSTRAINT "Product_sku_key" UNIQUE ("sku")
      );

      CREATE TABLE "InventoryMovement" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "delta" INTEGER NOT NULL,
        "type" "InventoryMovementType" NOT NULL DEFAULT 'manual_adjustment',
        "reason" TEXT NOT NULL,
        "referenceType" TEXT,
        "referenceId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "Order" (
        "id" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "customerNameSnapshot" TEXT NOT NULL,
        "phoneSnapshot" TEXT NOT NULL,
        "emailSnapshot" TEXT,
        "deliveryAddressSnapshot" TEXT NOT NULL,
        "paymentMethod" "PaymentMethod" NOT NULL,
        "paymentStatus" "PaymentStatus" NOT NULL,
        "deliveryMethod" "DeliveryMethod" NOT NULL,
        "status" "OrderStatus" NOT NULL,
        "notes" TEXT NOT NULL,
        "subtotal" INTEGER NOT NULL DEFAULT 0,
        "deliveryCost" INTEGER NOT NULL DEFAULT 0,
        "total" INTEGER NOT NULL DEFAULT 0,
        "confirmedAt" TIMESTAMP(3),
        "packedAt" TIMESTAMP(3),
        "shippedAt" TIMESTAMP(3),
        "deliveredAt" TIMESTAMP(3),
        "cancelledAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Order_orderNumber_key" UNIQUE ("orderNumber")
      );

      CREATE TABLE "OrderItem" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unitPrice" INTEGER NOT NULL,
        "totalPrice" INTEGER NOT NULL,
        CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "method" "PaymentMethod" NOT NULL,
        "status" "PaymentStatus" NOT NULL,
        "amount" INTEGER NOT NULL,
        "transactionId" TEXT,
        "provider" TEXT,
        "providerPayload" JSONB,
        "paidAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "Delivery" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "method" "DeliveryMethod" NOT NULL,
        "company" TEXT,
        "address" TEXT NOT NULL,
        "trackingNumber" TEXT,
        "shippingCost" INTEGER NOT NULL DEFAULT 0,
        "status" "DeliveryStatus" NOT NULL,
        "shippedAt" TIMESTAMP(3),
        "deliveredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Delivery_orderId_key" UNIQUE ("orderId")
      );

      CREATE TABLE "PackagingDetail" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "status" "PackagingStatus" NOT NULL,
        "packedAt" TIMESTAMP(3),
        "employeeId" TEXT,
        "weightGrams" INTEGER,
        "dimensions" TEXT,
        "fragile" BOOLEAN NOT NULL DEFAULT false,
        "packageType" TEXT,
        "comment" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PackagingDetail_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PackagingDetail_orderId_key" UNIQUE ("orderId")
      );

      CREATE TABLE "OrderStatusHistory" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "oldStatus" "OrderStatus",
        "newStatus" "OrderStatus" NOT NULL,
        "changedByType" "ActorType" NOT NULL DEFAULT 'system',
        "changedById" TEXT,
        "comment" TEXT,
        "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "RepairRequest" (
        "id" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "instrumentName" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "issue" TEXT NOT NULL,
        "status" "RepairStatus" NOT NULL,
        "notes" TEXT NOT NULL,
        "estimatedCost" INTEGER,
        "assignedMasterName" TEXT,
        "receivedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RepairRequest_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "Activity" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "messageKey" TEXT NOT NULL,
        "messageParams" JSONB NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "BusinessSettings" (
        "id" TEXT NOT NULL,
        "currency" TEXT NOT NULL,
        "lowStockThreshold" INTEGER NOT NULL,
        "defaultProductStatus" "ProductStatus" NOT NULL,
        "defaultMarkupPercent" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
      );

      CREATE INDEX "Session_expiresAt_idx" ON "Session" ("expiresAt");
      CREATE INDEX "Product_status_idx" ON "Product" ("status");
      CREATE INDEX "Product_categoryId_idx" ON "Product" ("categoryId");
      CREATE INDEX "Product_brand_idx" ON "Product" ("brand");
      CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement" ("productId");
      CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement" ("createdAt");
      CREATE INDEX "Order_customerId_idx" ON "Order" ("customerId");
      CREATE INDEX "Order_status_idx" ON "Order" ("status");
      CREATE INDEX "Order_paymentStatus_idx" ON "Order" ("paymentStatus");
      CREATE INDEX "Order_orderNumber_idx" ON "Order" ("orderNumber");
      CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" ("orderId");
      CREATE INDEX "OrderItem_productId_idx" ON "OrderItem" ("productId");
      CREATE INDEX "Payment_orderId_idx" ON "Payment" ("orderId");
      CREATE INDEX "Payment_status_idx" ON "Payment" ("status");
      CREATE INDEX "Delivery_status_idx" ON "Delivery" ("status");
      CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory" ("orderId");
      CREATE INDEX "OrderStatusHistory_changedAt_idx" ON "OrderStatusHistory" ("changedAt");
      CREATE INDEX "RepairRequest_customerId_idx" ON "RepairRequest" ("customerId");
      CREATE INDEX "RepairRequest_status_idx" ON "RepairRequest" ("status");
      CREATE INDEX "Activity_timestamp_idx" ON "Activity" ("timestamp");

      ALTER TABLE "Session" ADD CONSTRAINT "Session_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "Session" ADD CONSTRAINT "Session_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "PackagingDetail" ADD CONSTRAINT "PackagingDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "PackagingDetail" ADD CONSTRAINT "PackagingDetail_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "BusinessSettings" CASCADE;
      DROP TABLE IF EXISTS "Activity" CASCADE;
      DROP TABLE IF EXISTS "RepairRequest" CASCADE;
      DROP TABLE IF EXISTS "OrderStatusHistory" CASCADE;
      DROP TABLE IF EXISTS "PackagingDetail" CASCADE;
      DROP TABLE IF EXISTS "Delivery" CASCADE;
      DROP TABLE IF EXISTS "Payment" CASCADE;
      DROP TABLE IF EXISTS "OrderItem" CASCADE;
      DROP TABLE IF EXISTS "Order" CASCADE;
      DROP TABLE IF EXISTS "InventoryMovement" CASCADE;
      DROP TABLE IF EXISTS "Product" CASCADE;
      DROP TABLE IF EXISTS "Category" CASCADE;
      DROP TABLE IF EXISTS "Session" CASCADE;
      DROP TABLE IF EXISTS "Customer" CASCADE;
      DROP TABLE IF EXISTS "Employee" CASCADE;

      DROP TYPE IF EXISTS "ActorType" CASCADE;
      DROP TYPE IF EXISTS "InventoryMovementType" CASCADE;
      DROP TYPE IF EXISTS "PackagingStatus" CASCADE;
      DROP TYPE IF EXISTS "DeliveryStatus" CASCADE;
      DROP TYPE IF EXISTS "DeliveryMethod" CASCADE;
      DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
      DROP TYPE IF EXISTS "CustomerTier" CASCADE;
      DROP TYPE IF EXISTS "PrincipalType" CASCADE;
      DROP TYPE IF EXISTS "Condition" CASCADE;
      DROP TYPE IF EXISTS "RepairStatus" CASCADE;
      DROP TYPE IF EXISTS "OrderStatus" CASCADE;
      DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
      DROP TYPE IF EXISTS "ProductStatus" CASCADE;
      DROP TYPE IF EXISTS "Role" CASCADE;
    `);
  }
}
