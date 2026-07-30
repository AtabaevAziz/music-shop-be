DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type AS t
    JOIN pg_enum AS e ON e.enumtypid = t.oid
    WHERE t.typname = 'PaymentStatus'
      AND e.enumlabel = 'partial'
  ) THEN
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

    DROP TYPE "PaymentStatus_old";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PaymentStatus'
  ) THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type AS t
    JOIN pg_enum AS e ON e.enumtypid = t.oid
    WHERE t.typname = 'OrderStatus'
      AND e.enumlabel = 'ready_for_pickup'
  ) THEN
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

    DROP TYPE "OrderStatus_old";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'OrderStatus'
  ) THEN
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'online');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryMethod') THEN
    CREATE TYPE "DeliveryMethod" AS ENUM ('pickup', 'courier', 'delivery_company', 'post');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "DeliveryStatus" AS ENUM ('not_ready', 'ready_for_shipment', 'shipped', 'in_transit', 'delivered', 'delivery_failed', 'returned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PackagingStatus') THEN
    CREATE TYPE "PackagingStatus" AS ENUM ('not_started', 'in_progress', 'packed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InventoryMovementType') THEN
    CREATE TYPE "InventoryMovementType" AS ENUM ('reserve', 'release', 'ship', 'manual_adjustment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActorType') THEN
    CREATE TYPE "ActorType" AS ENUM ('system', 'employee', 'customer');
  END IF;
END $$;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "reservedQty" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

ALTER TABLE "InventoryMovement"
  ADD COLUMN IF NOT EXISTS "type" "InventoryMovementType" NOT NULL DEFAULT 'manual_adjustment',
  ADD COLUMN IF NOT EXISTS "referenceType" TEXT,
  ADD COLUMN IF NOT EXISTS "referenceId" TEXT;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "customerNameSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "emailSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryAddressSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod",
  ADD COLUMN IF NOT EXISTS "deliveryMethod" "DeliveryMethod",
  ADD COLUMN IF NOT EXISTS "subtotal" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "deliveryCost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "packedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "productName" TEXT,
  ADD COLUMN IF NOT EXISTS "quantity" INTEGER,
  ADD COLUMN IF NOT EXISTS "totalPrice" INTEGER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'OrderItem'
      AND column_name = 'qty'
  ) THEN
    UPDATE "OrderItem" AS oi
    SET
      "productName" = COALESCE(oi."productName", p."name"),
      "quantity" = COALESCE(oi."quantity", oi."qty"),
      "totalPrice" = COALESCE(oi."totalPrice", COALESCE(oi."quantity", oi."qty") * oi."unitPrice")
    FROM "Product" AS p
    WHERE p."id" = oi."productId";
  ELSE
    UPDATE "OrderItem" AS oi
    SET
      "productName" = COALESCE(oi."productName", p."name"),
      "totalPrice" = COALESCE(oi."totalPrice", oi."quantity" * oi."unitPrice")
    FROM "Product" AS p
    WHERE p."id" = oi."productId";
  END IF;
END $$;

WITH ordered_orders AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS row_num
  FROM "Order"
),
item_totals AS (
  SELECT
    "orderId",
    SUM("quantity" * "unitPrice")::INTEGER AS "subtotal"
  FROM "OrderItem"
  GROUP BY "orderId"
),
backfill AS (
  SELECT
    o."id",
    'ORD-' || LPAD((1000 + ordered_orders.row_num)::text, 4, '0') AS "orderNumber",
    COALESCE(NULLIF(TRIM(c."fullName"), ''), NULLIF(TRIM(c."name"), ''), 'Unknown customer') AS "customerNameSnapshot",
    COALESCE(NULLIF(TRIM(c."phone"), ''), 'Unknown phone') AS "phoneSnapshot",
    NULLIF(TRIM(c."email"), '') AS "emailSnapshot",
    'Address pending confirmation' AS "deliveryAddressSnapshot",
    'cash'::"PaymentMethod" AS "paymentMethod",
    'pickup'::"DeliveryMethod" AS "deliveryMethod",
    COALESCE(item_totals."subtotal", 0) AS "subtotal",
    0 AS "deliveryCost",
    COALESCE(item_totals."subtotal", 0) AS "total",
    CASE
      WHEN o."status" IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'returned') THEN o."updatedAt"
      ELSE NULL
    END AS "confirmedAt",
    CASE
      WHEN o."status" IN ('packed', 'shipped', 'delivered', 'returned') THEN o."updatedAt"
      ELSE NULL
    END AS "packedAt",
    CASE
      WHEN o."status" IN ('shipped', 'delivered', 'returned') THEN o."updatedAt"
      ELSE NULL
    END AS "shippedAt",
    CASE
      WHEN o."status" = 'delivered' THEN o."updatedAt"
      ELSE NULL
    END AS "deliveredAt",
    CASE
      WHEN o."status" = 'cancelled' THEN o."updatedAt"
      ELSE NULL
    END AS "cancelledAt"
  FROM "Order" AS o
  JOIN ordered_orders ON ordered_orders."id" = o."id"
  JOIN "Customer" AS c ON c."id" = o."customerId"
  LEFT JOIN item_totals ON item_totals."orderId" = o."id"
)
UPDATE "Order" AS o
SET
  "orderNumber" = COALESCE(o."orderNumber", backfill."orderNumber"),
  "customerNameSnapshot" = COALESCE(o."customerNameSnapshot", backfill."customerNameSnapshot"),
  "phoneSnapshot" = COALESCE(o."phoneSnapshot", backfill."phoneSnapshot"),
  "emailSnapshot" = COALESCE(o."emailSnapshot", backfill."emailSnapshot"),
  "deliveryAddressSnapshot" = COALESCE(o."deliveryAddressSnapshot", backfill."deliveryAddressSnapshot"),
  "paymentMethod" = COALESCE(o."paymentMethod", backfill."paymentMethod"),
  "deliveryMethod" = COALESCE(o."deliveryMethod", backfill."deliveryMethod"),
  "subtotal" = CASE WHEN o."subtotal" = 0 THEN backfill."subtotal" ELSE o."subtotal" END,
  "deliveryCost" = COALESCE(o."deliveryCost", backfill."deliveryCost"),
  "total" = CASE WHEN o."total" = 0 THEN backfill."total" ELSE o."total" END,
  "confirmedAt" = COALESCE(o."confirmedAt", backfill."confirmedAt"),
  "packedAt" = COALESCE(o."packedAt", backfill."packedAt"),
  "shippedAt" = COALESCE(o."shippedAt", backfill."shippedAt"),
  "deliveredAt" = COALESCE(o."deliveredAt", backfill."deliveredAt"),
  "cancelledAt" = COALESCE(o."cancelledAt", backfill."cancelledAt")
FROM backfill
WHERE backfill."id" = o."id";

ALTER TABLE "Order"
  ALTER COLUMN "orderNumber" SET NOT NULL,
  ALTER COLUMN "customerNameSnapshot" SET NOT NULL,
  ALTER COLUMN "phoneSnapshot" SET NOT NULL,
  ALTER COLUMN "deliveryAddressSnapshot" SET NOT NULL,
  ALTER COLUMN "paymentMethod" SET NOT NULL,
  ALTER COLUMN "deliveryMethod" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");

ALTER TABLE "OrderItem"
  ALTER COLUMN "productName" SET NOT NULL,
  ALTER COLUMN "quantity" SET NOT NULL,
  ALTER COLUMN "totalPrice" SET NOT NULL;

ALTER TABLE "OrderItem"
  DROP COLUMN IF EXISTS "qty";

CREATE TABLE IF NOT EXISTS "Payment" (
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

CREATE TABLE IF NOT EXISTS "Delivery" (
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

CREATE TABLE IF NOT EXISTS "PackagingDetail" (
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

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
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

CREATE INDEX IF NOT EXISTS "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "Delivery_orderId_key" ON "Delivery"("orderId");
CREATE INDEX IF NOT EXISTS "Delivery_status_idx" ON "Delivery"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "PackagingDetail_orderId_key" ON "PackagingDetail"("orderId");

CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX IF NOT EXISTS "OrderStatusHistory_changedAt_idx" ON "OrderStatusHistory"("changedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Payment_orderId_fkey'
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Delivery_orderId_fkey'
  ) THEN
    ALTER TABLE "Delivery"
      ADD CONSTRAINT "Delivery_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PackagingDetail_orderId_fkey'
  ) THEN
    ALTER TABLE "PackagingDetail"
      ADD CONSTRAINT "PackagingDetail_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PackagingDetail_employeeId_fkey'
  ) THEN
    ALTER TABLE "PackagingDetail"
      ADD CONSTRAINT "PackagingDetail_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrderStatusHistory_orderId_fkey'
  ) THEN
    ALTER TABLE "OrderStatusHistory"
      ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrderStatusHistory_changedById_fkey'
  ) THEN
    ALTER TABLE "OrderStatusHistory"
      ADD CONSTRAINT "OrderStatusHistory_changedById_fkey"
      FOREIGN KEY ("changedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
