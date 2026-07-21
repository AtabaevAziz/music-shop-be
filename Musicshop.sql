-- music_shop reporting queries for DBeaver CE
-- Expected local connection:
--   host: localhost
--   port: 5433
--   database: music_shop
--   schema: public
-- Prisma migrations and seed create the schema/data.
-- This file can be executed in DBeaver CE to bootstrap the schema and demo data.
-- The bootstrap section below is destructive for the current database/schema:
-- it drops the existing Music Shop tables/types and recreates them from scratch.
-- After bootstrap, the reporting queries run against the recreated data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO public;

-- 0. Connection sanity check for DBeaver CE
SELECT
  current_database() AS current_database,
  current_schema() AS current_schema,
  current_user AS current_user,
  inet_server_addr() AS server_host,
  inet_server_port() AS server_port;

-- 0.1. Bootstrap final Prisma-compatible schema and demo data
-- Run this block when you want to recreate the visible tables in DBeaver CE.

DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "InventoryMovement" CASCADE;
DROP TABLE IF EXISTS "RepairRequest" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Employee" CASCADE;
DROP TABLE IF EXISTS "Activity" CASCADE;
DROP TABLE IF EXISTS "BusinessSettings" CASCADE;

DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "ProductStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "RepairStatus" CASCADE;
DROP TYPE IF EXISTS "Condition" CASCADE;
DROP TYPE IF EXISTS "PrincipalType" CASCADE;
DROP TYPE IF EXISTS "CustomerTier" CASCADE;

CREATE TYPE "Role" AS ENUM ('admin', 'client');
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE "OrderStatus" AS ENUM ('new', 'confirmed', 'packed', 'ready_for_pickup', 'completed', 'cancelled');
CREATE TYPE "RepairStatus" AS ENUM ('new', 'diagnostics', 'in_progress', 'ready', 'completed', 'cancelled');
CREATE TYPE "Condition" AS ENUM ('new', 'used', 'showroom');
CREATE TYPE "PrincipalType" AS ENUM ('employee', 'customer');
CREATE TYPE "CustomerTier" AS ENUM ('standard', 'studio', 'vip');

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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "principalType" "PrincipalType" NOT NULL,
  "employeeId" TEXT,
  "customerId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "status" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "categoryId" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "costPrice" INTEGER NOT NULL,
  "stockQty" INTEGER NOT NULL,
  "minStockQty" INTEGER,
  "status" "ProductStatus" NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "specs" JSONB NOT NULL,
  "images" TEXT[] NOT NULL,
  "primaryImage" TEXT,
  "condition" "Condition" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "notes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Employee_login_key" ON "Employee"("login");
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "RepairRequest_customerId_idx" ON "RepairRequest"("customerId");
CREATE INDEX "RepairRequest_status_idx" ON "RepairRequest"("status");
CREATE INDEX "Activity_timestamp_idx" ON "Activity"("timestamp");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RepairRequest"
  ADD CONSTRAINT "RepairRequest_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "BusinessSettings" (
  "id", "currency", "lowStockThreshold", "defaultProductStatus", "defaultMarkupPercent", "createdAt", "updatedAt"
) VALUES (
  'business-settings', 'UZS', 3, 'draft', 28, TIMESTAMP '2026-07-09 10:00:00', TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Employee" (
  "id", "name", "login", "email", "phone", "role", "status", "passwordHash", "createdAt", "updatedAt"
) VALUES
(
  'employee-admin',
  'Admin',
  'admin',
  'admin@musicshop.local',
  '+998900000001',
  'admin',
  'active',
  crypt('Secret!1', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'employee-001',
  'Operations Admin',
  'manager',
  'manager@musicshop.local',
  '+998901112233',
  'admin',
  'active',
  crypt('manager@musicshop.local', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Customer" (
  "id", "name", "fullName", "phone", "email", "tier", "status", "notes", "passwordHash", "createdAt", "updatedAt"
) VALUES
(
  'customer-001',
  'Amina Karimova',
  'Amina Karimova',
  '+998901234567',
  'amina@example.com',
  'vip',
  'active',
  'Frequent keyboard buyer',
  crypt('amina@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'customer-002',
  'Studio Buyer',
  'Studio Buyer LLC',
  '+998907654321',
  'studio@example.com',
  'studio',
  'active',
  'Bulk accessory orders',
  crypt('studio@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Category" (
  "id", "name", "slug", "parentId", "status", "description", "createdAt", "updatedAt"
) VALUES
(
  'category-pianos',
  'Digital Pianos',
  'pianos',
  NULL,
  'active',
  'Portable and stage pianos',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'category-guitars',
  'Guitars',
  'guitars',
  NULL,
  'active',
  'Electric and acoustic guitars',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Product" (
  "id", "name", "sku", "barcode", "categoryId", "brand", "price", "costPrice", "stockQty", "minStockQty",
  "status", "shortDescription", "description", "specs", "images", "primaryImage", "condition", "createdAt", "updatedAt"
) VALUES
(
  'product-player-strat',
  'Fender Player Stratocaster',
  'FEN-STRAT-001',
  '1234567890123',
  'category-guitars',
  'Fender',
  9800000,
  7600000,
  4,
  2,
  'active',
  'Versatile electric guitar',
  'Full product description',
  '{"Body":"Alder","Neck":"Maple"}'::jsonb,
  ARRAY['/assets/fender-player-stratocaster.jpg'],
  '/assets/fender-player-stratocaster.jpg',
  'new',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'product-yamaha-p125',
  'Yamaha P-125',
  'YAM-P125-001',
  '3210987654321',
  'category-pianos',
  'Yamaha',
  8700000,
  6900000,
  2,
  1,
  'active',
  'Portable stage piano',
  'Weighted keys and compact body',
  '{"Keys":"88","Action":"GHS"}'::jsonb,
  ARRAY['/assets/yamaha-p125.jpg'],
  '/assets/yamaha-p125.jpg',
  'new',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "InventoryMovement" (
  "id", "productId", "delta", "reason", "createdAt"
) VALUES (
  'movement-ord-1001-product-player-strat',
  'product-player-strat',
  -1,
  'Reserved for client order ORD-1001',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Order" (
  "id", "customerId", "paymentStatus", "status", "notes", "createdAt", "updatedAt"
) VALUES (
  'ORD-1001',
  'customer-001',
  'pending',
  'confirmed',
  'Please confirm pickup time.',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:05:00'
);

INSERT INTO "OrderItem" (
  "id", "orderId", "productId", "qty", "unitPrice"
) VALUES (
  'order-item-ord-1001-product-player-strat',
  'ORD-1001',
  'product-player-strat',
  1,
  9800000
);

INSERT INTO "RepairRequest" (
  "id", "customerId", "instrumentName", "brand", "issue", "status", "notes", "estimatedCost",
  "assignedMasterName", "receivedAt", "createdAt", "updatedAt"
) VALUES (
  'REP-2001',
  'customer-001',
  'Yamaha P-125',
  'Yamaha',
  'Keys have uneven velocity response.',
  'new',
  'Unit is still powering on.',
  350000,
  'Akmal R.',
  TIMESTAMP '2026-07-08 00:00:00',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
);

INSERT INTO "Activity" (
  "id", "title", "messageKey", "messageParams", "timestamp"
) VALUES (
  'activity-order-ord-1001',
  'activity.orderMoved',
  'activity.orderMoved',
  '{"orderId":"ORD-1001","status":"confirmed"}'::jsonb,
  TIMESTAMP '2026-07-09 10:00:00'
);

-- 1. Product overview with category hierarchy and margin indicators
SELECT
  p."id" AS product_id,
  p."name" AS product_name,
  p."sku" AS sku,
  p."barcode" AS barcode,
  p."brand" AS brand,
  c."name" AS category_name,
  parent_c."name" AS parent_category_name,
  p."condition" AS condition,
  p."status" AS product_status,
  p."price" AS sale_price,
  p."costPrice" AS cost_price,
  p."price" - p."costPrice" AS margin_amount,
  CASE
    WHEN p."costPrice" = 0 THEN NULL
    ELSE ROUND(((p."price" - p."costPrice")::numeric / p."costPrice") * 100, 2)
  END AS margin_percent,
  p."stockQty" AS stock_qty,
  p."minStockQty" AS min_stock_qty,
  p."createdAt" AS created_at,
  p."updatedAt" AS updated_at
FROM "Product" AS p
JOIN "Category" AS c
  ON c."id" = p."categoryId"
LEFT JOIN "Category" AS parent_c
  ON parent_c."id" = c."parentId"
ORDER BY p."updatedAt" DESC, p."name" ASC;

-- 2. Low-stock and out-of-stock products using product threshold or fallback business setting
WITH latest_settings AS (
  SELECT
    bs."lowStockThreshold"
  FROM "BusinessSettings" AS bs
  ORDER BY bs."updatedAt" DESC, bs."id" ASC
  LIMIT 1
)
SELECT
  p."id" AS product_id,
  p."name" AS product_name,
  p."sku" AS sku,
  p."brand" AS brand,
  c."name" AS category_name,
  p."status" AS product_status,
  p."stockQty" AS stock_qty,
  p."minStockQty" AS product_threshold,
  bs."lowStockThreshold" AS default_threshold,
  COALESCE(p."minStockQty", bs."lowStockThreshold") AS effective_threshold,
  CASE
    WHEN p."stockQty" <= 0 THEN 'out_of_stock'
    ELSE 'low_stock'
  END AS stock_alert
FROM "Product" AS p
JOIN "Category" AS c
  ON c."id" = p."categoryId"
LEFT JOIN latest_settings AS bs
  ON TRUE
WHERE p."stockQty" <= COALESCE(p."minStockQty", bs."lowStockThreshold", 0)
ORDER BY p."stockQty" ASC, p."name" ASC;

-- 3. Recent inventory movements with resulting product context
SELECT
  im."id" AS movement_id,
  im."createdAt" AS moved_at,
  p."id" AS product_id,
  p."name" AS product_name,
  p."sku" AS sku,
  p."brand" AS brand,
  im."delta" AS qty_delta,
  im."reason" AS movement_reason,
  p."stockQty" AS current_stock_qty
FROM "InventoryMovement" AS im
JOIN "Product" AS p
  ON p."id" = im."productId"
ORDER BY im."createdAt" DESC, p."name" ASC
LIMIT 100;

-- 4. Orders with customer info and computed totals
SELECT
  o."id" AS order_id,
  o."createdAt" AS created_at,
  o."updatedAt" AS updated_at,
  o."status" AS order_status,
  o."paymentStatus" AS payment_status,
  c."id" AS customer_id,
  COALESCE(c."fullName", c."name") AS customer_name,
  c."phone" AS customer_phone,
  c."email" AS customer_email,
  COUNT(oi."id") AS item_lines,
  COALESCE(SUM(oi."qty"), 0) AS total_units,
  COALESCE(SUM(oi."qty" * oi."unitPrice"), 0) AS order_total,
  o."notes" AS notes
FROM "Order" AS o
JOIN "Customer" AS c
  ON c."id" = o."customerId"
LEFT JOIN "OrderItem" AS oi
  ON oi."orderId" = o."id"
GROUP BY
  o."id",
  o."createdAt",
  o."updatedAt",
  o."status",
  o."paymentStatus",
  c."id",
  c."fullName",
  c."name",
  c."phone",
  c."email",
  o."notes"
ORDER BY o."createdAt" DESC, o."id" ASC;

-- 5. Best-selling products by quantity and revenue
SELECT
  p."id" AS product_id,
  p."name" AS product_name,
  p."sku" AS sku,
  p."brand" AS brand,
  c."name" AS category_name,
  COUNT(DISTINCT oi."orderId") AS orders_count,
  COALESCE(SUM(oi."qty"), 0) AS units_sold,
  COALESCE(SUM(oi."qty" * oi."unitPrice"), 0) AS sales_revenue
FROM "OrderItem" AS oi
JOIN "Product" AS p
  ON p."id" = oi."productId"
JOIN "Category" AS c
  ON c."id" = p."categoryId"
GROUP BY
  p."id",
  p."name",
  p."sku",
  p."brand",
  c."name"
ORDER BY sales_revenue DESC, units_sold DESC, p."name" ASC;

-- 6. Customer summary with order and repair statistics
WITH order_totals AS (
  SELECT
    o."customerId" AS customer_id,
    COUNT(DISTINCT o."id") AS orders_count,
    COALESCE(SUM(oi."qty" * oi."unitPrice"), 0) AS total_spent,
    MAX(o."createdAt") AS last_order_at
  FROM "Order" AS o
  LEFT JOIN "OrderItem" AS oi
    ON oi."orderId" = o."id"
  GROUP BY o."customerId"
),
repair_totals AS (
  SELECT
    rr."customerId" AS customer_id,
    COUNT(*) AS repair_requests_count,
    MAX(rr."createdAt") AS last_repair_request_at
  FROM "RepairRequest" AS rr
  GROUP BY rr."customerId"
)
SELECT
  c."id" AS customer_id,
  c."name" AS name,
  COALESCE(c."fullName", c."name") AS full_name,
  c."email" AS email,
  c."phone" AS phone,
  c."tier" AS tier,
  c."status" AS status,
  c."createdAt" AS registered_at,
  COALESCE(ot.orders_count, 0) AS orders_count,
  COALESCE(ot.total_spent, 0) AS total_spent,
  ot.last_order_at AS last_order_at,
  COALESCE(rt.repair_requests_count, 0) AS repairs_count,
  rt.last_repair_request_at AS last_repair_request_at
FROM "Customer" AS c
LEFT JOIN order_totals AS ot
  ON ot.customer_id = c."id"
LEFT JOIN repair_totals AS rt
  ON rt.customer_id = c."id"
ORDER BY total_spent DESC, orders_count DESC, full_name ASC;

-- 7. Repair requests with customer and assignment details
SELECT
  rr."id" AS repair_request_id,
  rr."createdAt" AS created_at,
  rr."receivedAt" AS received_at,
  rr."updatedAt" AS updated_at,
  rr."status" AS repair_status,
  rr."brand" AS instrument_brand,
  rr."instrumentName" AS instrument_name,
  rr."issue" AS reported_issue,
  rr."estimatedCost" AS estimated_cost,
  rr."assignedMasterName" AS assigned_master_name,
  COALESCE(c."fullName", c."name") AS customer_name,
  c."phone" AS customer_phone,
  c."email" AS customer_email,
  rr."notes" AS notes
FROM "RepairRequest" AS rr
JOIN "Customer" AS c
  ON c."id" = rr."customerId"
ORDER BY rr."createdAt" DESC, rr."id" ASC;

-- 8. Latest activity feed entries
SELECT
  a."id" AS activity_id,
  a."timestamp" AS activity_timestamp,
  a."title" AS title,
  a."messageKey" AS message_key,
  a."messageParams" AS message_params
FROM "Activity" AS a
ORDER BY a."timestamp" DESC
LIMIT 100;

-- 9. Current business settings
SELECT
  bs."id" AS settings_id,
  bs."currency" AS currency,
  bs."lowStockThreshold" AS low_stock_threshold,
  bs."defaultProductStatus" AS default_product_status,
  bs."defaultMarkupPercent" AS default_markup_percent,
  bs."createdAt" AS created_at,
  bs."updatedAt" AS updated_at
FROM "BusinessSettings" AS bs
ORDER BY bs."updatedAt" DESC;
