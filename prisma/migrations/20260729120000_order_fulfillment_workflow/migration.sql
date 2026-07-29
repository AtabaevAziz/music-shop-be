-- Update enums whose value sets changed.
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";

CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

ALTER TABLE "Order"
  ALTER COLUMN "paymentStatus" TYPE "PaymentStatus"
  USING (
    CASE "paymentStatus"::text
      WHEN 'partial' THEN 'pending'
      ELSE "paymentStatus"::text
    END
  )::"PaymentStatus";

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
  'new',
  'awaiting_payment',
  'paid',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
);

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"::text
      WHEN 'ready_for_pickup' THEN 'packed'
      WHEN 'completed' THEN 'delivered'
      ELSE "status"::text
    END
  )::"OrderStatus";

DROP TYPE "PaymentStatus_old";
DROP TYPE "OrderStatus_old";

-- New enums introduced by the schema.
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'online');
CREATE TYPE "DeliveryMethod" AS ENUM ('pickup', 'courier', 'delivery_company', 'post');
CREATE TYPE "DeliveryStatus" AS ENUM ('not_ready', 'ready_for_shipment', 'shipped', 'in_transit', 'delivered', 'delivery_failed', 'returned');
CREATE TYPE "PackagingStatus" AS ENUM ('not_started', 'in_progress', 'packed');
CREATE TYPE "InventoryMovementType" AS ENUM ('reserve', 'release', 'ship', 'manual_adjustment');
CREATE TYPE "ActorType" AS ENUM ('system', 'employee', 'customer');

-- Product and inventory metadata.
ALTER TABLE "Product"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "reservedQty" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

ALTER TABLE "InventoryMovement"
  ADD COLUMN "type" "InventoryMovementType" NOT NULL DEFAULT 'manual_adjustment',
  ADD COLUMN "referenceType" TEXT,
  ADD COLUMN "referenceId" TEXT;

-- Order expansion: add columns as nullable/defaulted, backfill, then enforce.
ALTER TABLE "Order"
  ADD COLUMN "orderNumber" TEXT,
  ADD COLUMN "customerNameSnapshot" TEXT,
  ADD COLUMN "phoneSnapshot" TEXT,
  ADD COLUMN "emailSnapshot" TEXT,
  ADD COLUMN "deliveryAddressSnapshot" TEXT,
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "deliveryMethod" "DeliveryMethod",
  ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "total" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "packedAt" TIMESTAMP(3),
  ADD COLUMN "shippedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

WITH ordered_orders AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS row_num
  FROM "Order"
)
UPDATE "Order" AS o
SET
  "orderNumber" = 'ORD-' || LPAD((1000 + ordered_orders.row_num)::text, 4, '0'),
  "customerNameSnapshot" = COALESCE(NULLIF(TRIM(c."fullName"), ''), NULLIF(TRIM(c."name"), ''), 'Unknown customer'),
  "phoneSnapshot" = COALESCE(NULLIF(TRIM(c."phone"), ''), 'Unknown phone'),
  "emailSnapshot" = NULLIF(TRIM(c."email"), ''),
  "deliveryAddressSnapshot" = 'Address pending confirmation',
  "paymentMethod" = 'cash'::"PaymentMethod",
  "deliveryMethod" = 'pickup'::"DeliveryMethod",
  "subtotal" = COALESCE(item_totals."subtotal", 0),
  "deliveryCost" = 0,
  "total" = COALESCE(item_totals."subtotal", 0),
  "confirmedAt" = CASE
    WHEN o."status" IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'returned') THEN o."updatedAt"
    ELSE NULL
  END,
  "packedAt" = CASE
    WHEN o."status" IN ('packed', 'shipped', 'delivered', 'returned') THEN o."updatedAt"
    ELSE NULL
  END,
  "shippedAt" = CASE
    WHEN o."status" IN ('shipped', 'delivered', 'returned') THEN o."updatedAt"
    ELSE NULL
  END,
  "deliveredAt" = CASE
    WHEN o."status" = 'delivered' THEN o."updatedAt"
    ELSE NULL
  END,
  "cancelledAt" = CASE
    WHEN o."status" = 'cancelled' THEN o."updatedAt"
    ELSE NULL
  END
FROM ordered_orders
JOIN "Customer" AS c ON c."id" = o."customerId"
LEFT JOIN (
  SELECT "orderId", SUM("qty" * "unitPrice")::INTEGER AS "subtotal"
  FROM "OrderItem"
  GROUP BY "orderId"
) AS item_totals ON item_totals."orderId" = o."id"
WHERE ordered_orders."id" = o."id";

ALTER TABLE "Order"
  ALTER COLUMN "orderNumber" SET NOT NULL,
  ALTER COLUMN "customerNameSnapshot" SET NOT NULL,
  ALTER COLUMN "phoneSnapshot" SET NOT NULL,
  ALTER COLUMN "deliveryAddressSnapshot" SET NOT NULL,
  ALTER COLUMN "paymentMethod" SET NOT NULL,
  ALTER COLUMN "deliveryMethod" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- Order items: carry old qty forward before dropping it.
ALTER TABLE "OrderItem"
  ADD COLUMN "productName" TEXT,
  ADD COLUMN "quantity" INTEGER,
  ADD COLUMN "totalPrice" INTEGER;

UPDATE "OrderItem" AS oi
SET
  "productName" = p."name",
  "quantity" = oi."qty",
  "totalPrice" = oi."qty" * oi."unitPrice"
FROM "Product" AS p
WHERE p."id" = oi."productId";

ALTER TABLE "OrderItem"
  ALTER COLUMN "productName" SET NOT NULL,
  ALTER COLUMN "quantity" SET NOT NULL,
  ALTER COLUMN "totalPrice" SET NOT NULL,
  DROP COLUMN "qty";

-- New supporting tables.
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PackagingDetail_pkey" PRIMARY KEY ("id")
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

CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");

CREATE UNIQUE INDEX "PackagingDetail_orderId_key" ON "PackagingDetail"("orderId");

CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX "OrderStatusHistory_changedAt_idx" ON "OrderStatusHistory"("changedAt");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Delivery"
  ADD CONSTRAINT "Delivery_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PackagingDetail"
  ADD CONSTRAINT "PackagingDetail_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PackagingDetail_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderStatusHistory"
  ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderStatusHistory_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
