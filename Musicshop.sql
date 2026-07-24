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
  "image" TEXT NOT NULL,
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
),
(
  'employee-002',
  'Sales Floor Lead',
  'sales.lead',
  'sales.lead@musicshop.local',
  '+998901112244',
  'admin',
  'active',
  crypt('sales.lead@musicshop.local', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-10 09:00:00',
  TIMESTAMP '2026-07-10 09:00:00'
),
(
  'employee-003',
  'Repair Coordinator',
  'repair.coordinator',
  'repair.coordinator@musicshop.local',
  '+998901112255',
  'admin',
  'active',
  crypt('repair.coordinator@musicshop.local', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-10 09:30:00',
  TIMESTAMP '2026-07-10 09:30:00'
),
(
  'employee-004',
  'Finance Desk',
  'finance.desk',
  'finance.desk@musicshop.local',
  '+998901112266',
  'admin',
  'active',
  crypt('finance.desk@musicshop.local', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-11 08:45:00',
  TIMESTAMP '2026-07-11 08:45:00'
),
(
  'employee-005',
  'Weekend Visual Merchandiser',
  'visual.merch',
  'visual.merch@musicshop.local',
  '+998901112277',
  'admin',
  'inactive',
  crypt('visual.merch@musicshop.local', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-12 11:00:00',
  TIMESTAMP '2026-07-12 11:00:00'
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
),
(
  'customer-003',
  'Dilshod Rakhimov',
  'Dilshod Rakhimov',
  '+998901234568',
  'dilshod.rakhimov@example.com',
  'standard',
  'active',
  'First-time guitar shopper',
  crypt('dilshod.rakhimov@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-10 09:20:00',
  TIMESTAMP '2026-07-10 09:20:00'
),
(
  'customer-004',
  'Nodira Saidova',
  'Nodira Saidova',
  '+998901234569',
  'nodira.saidova@example.com',
  'vip',
  'active',
  'Owns a rehearsal studio',
  crypt('nodira.saidova@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-11 11:45:00',
  TIMESTAMP '2026-07-11 11:45:00'
),
(
  'customer-005',
  'Bekzod Ensemble',
  'Bekzod Ensemble',
  '+998901234570',
  'bekzod.ensemble@example.com',
  'standard',
  'active',
  'Mostly browsing acoustic stock',
  crypt('bekzod.ensemble@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-12 13:10:00',
  TIMESTAMP '2026-07-12 13:10:00'
),
(
  'customer-006',
  'Tashkent Music School',
  'Tashkent Music School',
  '+998901234571',
  'school.procurement@example.com',
  'studio',
  'active',
  'Recurring education orders',
  crypt('school.procurement@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-13 08:50:00',
  TIMESTAMP '2026-07-13 08:50:00'
),
(
  'customer-007',
  'Kamola Yuldasheva',
  'Kamola Yuldasheva',
  '+998901234572',
  'kamola.yuldasheva@example.com',
  'standard',
  'active',
  'Needs seasonal maintenance',
  crypt('kamola.yuldasheva@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-14 10:25:00',
  TIMESTAMP '2026-07-14 10:25:00'
),
(
  'customer-008',
  'Rustam Sessionman',
  'Rustam Sessionman',
  '+998901234573',
  'rustam.sessionman@example.com',
  'vip',
  'active',
  'Buys instruments for live sessions',
  crypt('rustam.sessionman@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-15 16:05:00',
  TIMESTAMP '2026-07-15 16:05:00'
),
(
  'customer-009',
  'Samarkand Jazz Hub',
  'Samarkand Jazz Hub',
  '+998901234574',
  'samarkandjazz@example.com',
  'studio',
  'active',
  'Restocking rehearsal room instruments',
  crypt('samarkandjazz@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-16 12:40:00',
  TIMESTAMP '2026-07-16 12:40:00'
),
(
  'customer-010',
  'Azizbek Tursunov',
  'Azizbek Tursunov',
  '+998901234575',
  'azizbek.tursunov@example.com',
  'standard',
  'active',
  'Learning piano and comparing options',
  crypt('azizbek.tursunov@example.com', gen_salt('bf', 10)),
  TIMESTAMP '2026-07-17 09:35:00',
  TIMESTAMP '2026-07-17 09:35:00'
);

INSERT INTO "Category" (
  "id", "name", "slug", "parentId", "image", "status", "description", "createdAt", "updatedAt"
) VALUES
(
  'category-pianos',
  'Digital Pianos',
  'pianos',
  NULL,
  '/assets/grand-piano.png',
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
  '/assets/fender-player-stratocaster.jpg',
  'active',
  'Electric and acoustic guitars',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'category-drums',
  'Electronic Drums & Pads',
  'drums',
  NULL,
  '/assets/roland-spd-sx.jpg',
  'active',
  'Pads, drum modules and compact performance kits',
  TIMESTAMP '2026-07-10 10:00:00',
  TIMESTAMP '2026-07-10 10:00:00'
),
(
  'category-microphones',
  'Studio Microphones',
  'microphones',
  NULL,
  '/assets/shure-sm7b.jpg',
  'active',
  'Broadcast and recording microphones for studio work',
  TIMESTAMP '2026-07-10 10:15:00',
  TIMESTAMP '2026-07-10 10:15:00'
),
(
  'category-violins',
  'Violins',
  'violins',
  NULL,
  '/assets/violin.png',
  'active',
  'Student and performance violins for lessons and stage',
  TIMESTAMP '2026-07-10 10:30:00',
  TIMESTAMP '2026-07-10 10:30:00'
),
(
  'category-saxophones',
  'Saxophones',
  'saxophones',
  NULL,
  '/assets/saxophone.png',
  'active',
  'Alto and tenor saxophones for study and performance',
  TIMESTAMP '2026-07-10 10:45:00',
  TIMESTAMP '2026-07-10 10:45:00'
),
(
  'category-keyboards',
  'Home Keyboards',
  'keyboards',
  NULL,
  '/assets/grand-piano.png',
  'active',
  'Portable keyboards for practice corners and home studios',
  TIMESTAMP '2026-07-10 11:00:00',
  TIMESTAMP '2026-07-10 11:00:00'
),
(
  'category-acoustic-guitars',
  'Acoustic Guitars',
  'acoustic-guitars',
  NULL,
  '/assets/acoustic-guitar.png',
  'active',
  'Steel-string acoustics for students and singer-songwriters',
  TIMESTAMP '2026-07-10 11:15:00',
  TIMESTAMP '2026-07-10 11:15:00'
),
(
  'category-cellos',
  'Cellos',
  'cellos',
  NULL,
  '/assets/cello.png',
  'active',
  'Practice and stage cellos for conservatory and ensemble work',
  TIMESTAMP '2026-07-10 11:30:00',
  TIMESTAMP '2026-07-10 11:30:00'
),
(
  'category-dombras',
  'Dombras',
  'dombras',
  NULL,
  '/assets/dombra.png',
  'active',
  'Traditional Central Asian dombras for folk repertoire and classes',
  TIMESTAMP '2026-07-10 11:45:00',
  TIMESTAMP '2026-07-10 11:45:00'
),
(
  'category-flutes',
  'Flutes',
  'flutes',
  NULL,
  '/assets/flute.png',
  'active',
  'Student and intermediate concert flutes for study and recital use',
  TIMESTAMP '2026-07-10 12:00:00',
  TIMESTAMP '2026-07-10 12:00:00'
),
(
  'category-trumpets',
  'Trumpets',
  'trumpets',
  NULL,
  '/assets/trumpet.png',
  'active',
  'Bb trumpets for school bands, studio charts and live brass sections',
  TIMESTAMP '2026-07-10 12:15:00',
  TIMESTAMP '2026-07-10 12:15:00'
),
(
  'category-electric-guitars',
  'Electric Guitars',
  'electric-guitars',
  NULL,
  '/assets/electric-guitar.png',
  'active',
  'Modern electric guitars for rehearsal rooms, lessons and live rigs',
  TIMESTAMP '2026-07-10 12:30:00',
  TIMESTAMP '2026-07-10 12:30:00'
),
(
  'category-drum-kits',
  'Drum Kits',
  'drum-kits',
  NULL,
  '/assets/drum-kit.png',
  'active',
  'Full kits for rehearsal rooms, venues and teaching studios',
  TIMESTAMP '2026-07-10 12:45:00',
  TIMESTAMP '2026-07-10 12:45:00'
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
  3,
  'active',
  'Portable stage piano',
  'Weighted keys and compact body',
  '{"Keys":"88","Action":"GHS"}'::jsonb,
  ARRAY['/assets/yamaha-p125.jpg'],
  '/assets/yamaha-p125.jpg',
  'new',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'product-roland-spd-sx',
  'Roland SPD-SX Sampling Pad',
  'ROL-SPDSX-001',
  '5901234123401',
  'category-drums',
  'Roland',
  7400000,
  5900000,
  1,
  2,
  'active',
  'Performance sampling pad for hybrid drum rigs',
  'Nine responsive pads, onboard sampling and live-ready trigger routing.',
  '{"Pads":"9","Memory":"4GB","Outputs":"Stereo main plus sub outs"}'::jsonb,
  ARRAY['/assets/roland-spd-sx.jpg'],
  '/assets/roland-spd-sx.jpg',
  'showroom',
  TIMESTAMP '2026-07-10 12:00:00',
  TIMESTAMP '2026-07-10 12:00:00'
),
(
  'product-shure-sm7b',
  'Shure SM7B',
  'SHU-SM7B-001',
  '042406088879',
  'category-microphones',
  'Shure',
  4200000,
  3100000,
  6,
  2,
  'active',
  'Broadcast dynamic microphone for studio voice work',
  'A proven dynamic mic for podcast, radio and treated vocal booths.',
  '{"Type":"Dynamic","Pattern":"Cardioid","Mount":"Integrated yoke"}'::jsonb,
  ARRAY['/assets/shure-sm7b.jpg'],
  '/assets/shure-sm7b.jpg',
  'new',
  TIMESTAMP '2026-07-10 12:20:00',
  TIMESTAMP '2026-07-10 12:20:00'
),
(
  'product-stentor-student-ii',
  'Stentor Student II Violin',
  'STE-VLN-002',
  '9780201379624',
  'category-violins',
  'Stentor',
  2800000,
  2000000,
  2,
  2,
  'active',
  'Entry-level violin outfit for lessons and recitals',
  'Laminate body student violin outfit with bow, case and rosin included.',
  '{"Size":"4/4","Top":"Spruce laminate","Accessories":"Case, bow, rosin"}'::jsonb,
  ARRAY['/assets/violin.png'],
  '/assets/violin.png',
  'new',
  TIMESTAMP '2026-07-10 12:40:00',
  TIMESTAMP '2026-07-10 12:40:00'
),
(
  'product-yamaha-f310',
  'Yamaha F310',
  'YAM-F310-001',
  '4957812496946',
  'category-acoustic-guitars',
  'Yamaha',
  2450000,
  1780000,
  5,
  2,
  'active',
  'Reliable acoustic guitar for practice and songwriting',
  'Full-size dreadnought acoustic with balanced projection and comfortable action.',
  '{"Body":"Dreadnought","Top":"Spruce","BackSides":"Meranti"}'::jsonb,
  ARRAY['/assets/acoustic-guitar.png'],
  '/assets/acoustic-guitar.png',
  'new',
  TIMESTAMP '2026-07-10 13:00:00',
  TIMESTAMP '2026-07-10 13:00:00'
),
(
  'product-casio-ct-s1',
  'Casio CT-S1',
  'CAS-CTS1-001',
  '4971850315120',
  'category-keyboards',
  'Casio',
  3600000,
  2700000,
  7,
  2,
  'active',
  'Portable home keyboard for practice corners and casual arranging',
  'Compact 61-key keyboard with built-in sounds for home study, songwriting demos and family practice spaces.',
  '{"Keys":"61","Speakers":"Built-in stereo","Weight":"4.5kg"}'::jsonb,
  ARRAY['/assets/grand-piano.png'],
  '/assets/grand-piano.png',
  'new',
  TIMESTAMP '2026-07-10 13:10:00',
  TIMESTAMP '2026-07-10 13:10:00'
),
(
  'product-casio-cdp-s110',
  'Casio CDP-S110',
  'CAS-CDPS110-001',
  '4971850362629',
  'category-keyboards',
  'Casio',
  5200000,
  4100000,
  3,
  2,
  'draft',
  'Slim digital piano for compact teaching spaces',
  'Minimal-footprint digital piano waiting for merchandising approval before launch.',
  '{"Keys":"88","Action":"Scaled hammer","Weight":"10.5kg"}'::jsonb,
  ARRAY['/assets/grand-piano.png'],
  '/assets/grand-piano.png',
  'showroom',
  TIMESTAMP '2026-07-10 13:20:00',
  TIMESTAMP '2026-07-10 13:20:00'
),
(
  'product-yamaha-yas-280',
  'Yamaha YAS-280',
  'YAM-YAS280-001',
  '4957812609131',
  'category-saxophones',
  'Yamaha',
  8900000,
  6800000,
  2,
  1,
  'active',
  'Student alto saxophone for lessons, ensemble work and recital prep',
  'Responsive Eb alto saxophone with comfortable key layout for school programs, private lessons and first studio takes.',
  '{"Key":"Eb","Finish":"Gold lacquer","Included":"Case and mouthpiece"}'::jsonb,
  ARRAY['/assets/saxophone.png'],
  '/assets/saxophone.png',
  'new',
  TIMESTAMP '2026-07-10 13:30:00',
  TIMESTAMP '2026-07-10 13:30:00'
),
(
  'product-selmer-as500',
  'Selmer AS500 Alto Saxophone',
  'SEL-AS500-001',
  '641064829305',
  'category-saxophones',
  'Selmer',
  6600000,
  5100000,
  1,
  1,
  'archived',
  'Archived alto sax listing kept for historical order context',
  'Legacy alto saxophone SKU retained in admin catalog for prior quoting history.',
  '{"Finish":"Lacquer","Key":"Eb","Included":"Case and mouthpiece"}'::jsonb,
  ARRAY['/assets/saxophone.png'],
  '/assets/saxophone.png',
  'used',
  TIMESTAMP '2026-07-10 13:40:00',
  TIMESTAMP '2026-07-10 13:40:00'
),
(
  'product-yamaha-svc50',
  'Yamaha SVC50 Silent Cello',
  'YAM-SVC50-001',
  '4957812611042',
  'category-cellos',
  'Yamaha',
  12600000,
  9800000,
  1,
  1,
  'active',
  'Stage-friendly silent cello for practice and live amplification',
  'Electric silent cello with onboard pickup for rehearsal rooms, apartments and live stage monitoring.',
  '{"Strings":"4","Output":"Line out plus headphones","Frame":"Detachable silent body"}'::jsonb,
  ARRAY['/assets/cello.png'],
  '/assets/cello.png',
  'showroom',
  TIMESTAMP '2026-07-10 14:00:00',
  TIMESTAMP '2026-07-10 14:00:00'
),
(
  'product-arman-dombra',
  'Arman Folk Dombra',
  'ARM-DOM-001',
  '9981234500012',
  'category-dombras',
  'Arman',
  1900000,
  1350000,
  4,
  1,
  'active',
  'Traditional two-string dombra for folk classes and ensemble repertoire',
  'Lightweight folk dombra with bright attack for ensemble work, lessons and cultural programs.',
  '{"Strings":"2","Top":"Spruce","Finish":"Natural satin"}'::jsonb,
  ARRAY['/assets/dombra.png'],
  '/assets/dombra.png',
  'new',
  TIMESTAMP '2026-07-10 14:15:00',
  TIMESTAMP '2026-07-10 14:15:00'
),
(
  'product-yamaha-yfl-212',
  'Yamaha YFL-212',
  'YAM-YFL212-001',
  '4957812596400',
  'category-flutes',
  'Yamaha',
  4800000,
  3600000,
  4,
  2,
  'active',
  'Student concert flute for lessons and school orchestra work',
  'Reliable closed-hole student flute with balanced response for first years of study and exams.',
  '{"Key":"C","Headjoint":"Silver-plated","System":"Closed-hole plateau"}'::jsonb,
  ARRAY['/assets/flute.png'],
  '/assets/flute.png',
  'new',
  TIMESTAMP '2026-07-10 14:30:00',
  TIMESTAMP '2026-07-10 14:30:00'
),
(
  'product-yamaha-ytr-2330',
  'Yamaha YTR-2330',
  'YAM-YTR2330-001',
  '4957812596653',
  'category-trumpets',
  'Yamaha',
  5900000,
  4500000,
  2,
  1,
  'active',
  'Bb trumpet for school bands, studio charts and brass sections',
  'Balanced student trumpet with responsive intonation for ensemble rehearsals and concert use.',
  '{"Key":"Bb","Bore":"ML","Bell":"Yellow brass"}'::jsonb,
  ARRAY['/assets/trumpet.png'],
  '/assets/trumpet.png',
  'new',
  TIMESTAMP '2026-07-10 14:45:00',
  TIMESTAMP '2026-07-10 14:45:00'
),
(
  'product-ibanez-rg421',
  'Ibanez RG421',
  'IBA-RG421-001',
  '4515276967331',
  'category-electric-guitars',
  'Ibanez',
  7600000,
  6000000,
  2,
  1,
  'active',
  'Modern electric guitar for fast practice sets and live rigs',
  'Fixed-bridge RG platform with slim neck profile for technique work, rehearsals and club stages.',
  '{"Pickups":"HH","Bridge":"Fixed","Neck":"Wizard III maple"}'::jsonb,
  ARRAY['/assets/electric-guitar.png'],
  '/assets/electric-guitar.png',
  'new',
  TIMESTAMP '2026-07-10 15:00:00',
  TIMESTAMP '2026-07-10 15:00:00'
),
(
  'product-yamaha-stage-custom',
  'Yamaha Stage Custom Birch Kit',
  'YAM-STAGECUSTOM-001',
  '4957812481126',
  'category-drum-kits',
  'Yamaha',
  13400000,
  10400000,
  1,
  1,
  'active',
  'Full birch drum kit for rehearsal rooms and venue backline',
  'Five-piece birch kit tuned for compact stages, teaching rooms and all-round session work.',
  '{"Shells":"Birch","Pieces":"5","Finish":"Raven black"}'::jsonb,
  ARRAY['/assets/drum-kit.png'],
  '/assets/drum-kit.png',
  'showroom',
  TIMESTAMP '2026-07-10 15:15:00',
  TIMESTAMP '2026-07-10 15:15:00'
);

INSERT INTO "InventoryMovement" (
  "id", "productId", "delta", "reason", "createdAt"
) VALUES
(
  'movement-ord-1001-product-player-strat',
  'product-player-strat',
  -1,
  'Reserved for client order ORD-1001',
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'movement-ord-1002-product-yamaha-p125',
  'product-yamaha-p125',
  -1,
  'Reserved for client order ORD-1002',
  TIMESTAMP '2026-07-10 11:30:00'
),
(
  'movement-ord-1003-product-player-strat',
  'product-player-strat',
  -1,
  'Reserved for client order ORD-1003',
  TIMESTAMP '2026-07-12 15:10:00'
),
(
  'movement-ord-1004-product-yamaha-p125',
  'product-yamaha-p125',
  -1,
  'Reserved for client order ORD-1004',
  TIMESTAMP '2026-07-13 09:15:00'
),
(
  'movement-ord-1005-product-player-strat',
  'product-player-strat',
  -1,
  'Reserved for client order ORD-1005',
  TIMESTAMP '2026-07-16 14:20:00'
),
(
  'movement-ord-1006-product-yamaha-p125',
  'product-yamaha-p125',
  -1,
  'Reserved for client order ORD-1006',
  TIMESTAMP '2026-07-18 12:00:00'
),
(
  'movement-restock-product-shure-sm7b',
  'product-shure-sm7b',
  3,
  'Weekly restock from distributor intake',
  TIMESTAMP '2026-07-21 09:00:00'
),
(
  'movement-audit-product-roland-spd-sx',
  'product-roland-spd-sx',
  -1,
  'Showroom audit adjustment after display handoff',
  TIMESTAMP '2026-07-21 11:15:00'
);

INSERT INTO "Order" (
  "id", "customerId", "paymentStatus", "status", "notes", "createdAt", "updatedAt"
) VALUES
(
  'ORD-1001',
  'customer-001',
  'pending',
  'confirmed',
  'Please confirm pickup time.',
  TIMESTAMP '2026-07-09 10:00:00',
  TIMESTAMP '2026-07-09 10:05:00'
),
(
  'ORD-1002',
  'customer-002',
  'partial',
  'packed',
  'Bulk stand order for rehearsal room.',
  TIMESTAMP '2026-07-10 11:30:00',
  TIMESTAMP '2026-07-10 13:00:00'
),
(
  'ORD-1003',
  'customer-004',
  'paid',
  'completed',
  'VIP pickup completed from showroom floor.',
  TIMESTAMP '2026-07-12 15:10:00',
  TIMESTAMP '2026-07-12 17:45:00'
),
(
  'ORD-1004',
  'customer-006',
  'pending',
  'new',
  'School procurement pending director approval.',
  TIMESTAMP '2026-07-13 09:15:00',
  TIMESTAMP '2026-07-13 09:15:00'
),
(
  'ORD-1005',
  'customer-008',
  'paid',
  'ready_for_pickup',
  'Hold until evening soundcheck pickup.',
  TIMESTAMP '2026-07-16 14:20:00',
  TIMESTAMP '2026-07-16 16:05:00'
),
(
  'ORD-1006',
  'customer-009',
  'pending',
  'confirmed',
  'Requested invoice copy by email.',
  TIMESTAMP '2026-07-18 12:00:00',
  TIMESTAMP '2026-07-18 12:25:00'
);

INSERT INTO "OrderItem" (
  "id", "orderId", "productId", "qty", "unitPrice"
) VALUES
(
  'order-item-ord-1001-product-player-strat',
  'ORD-1001',
  'product-player-strat',
  1,
  9800000
),
(
  'order-item-ord-1002-product-yamaha-p125',
  'ORD-1002',
  'product-yamaha-p125',
  1,
  8700000
),
(
  'order-item-ord-1003-product-player-strat',
  'ORD-1003',
  'product-player-strat',
  1,
  9800000
),
(
  'order-item-ord-1004-product-yamaha-p125',
  'ORD-1004',
  'product-yamaha-p125',
  1,
  8700000
),
(
  'order-item-ord-1005-product-player-strat',
  'ORD-1005',
  'product-player-strat',
  1,
  9800000
),
(
  'order-item-ord-1006-product-yamaha-p125',
  'ORD-1006',
  'product-yamaha-p125',
  1,
  8700000
);

INSERT INTO "RepairRequest" (
  "id", "customerId", "instrumentName", "brand", "issue", "status", "notes", "estimatedCost",
  "assignedMasterName", "receivedAt", "createdAt", "updatedAt"
) VALUES
(
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
),
(
  'REP-2002',
  'customer-004',
  'Fender Player Stratocaster',
  'Fender',
  'Output jack cuts out intermittently.',
  'diagnostics',
  'Customer requested quick estimate.',
  180000,
  'Sardor K.',
  TIMESTAMP '2026-07-12 09:00:00',
  TIMESTAMP '2026-07-12 10:30:00',
  TIMESTAMP '2026-07-12 12:00:00'
),
(
  'REP-2003',
  'customer-007',
  'Kawai ES110',
  'Kawai',
  'Sustain pedal response is inconsistent.',
  'ready',
  'Waiting for customer pickup confirmation.',
  220000,
  'Akmal R.',
  TIMESTAMP '2026-07-14 11:00:00',
  TIMESTAMP '2026-07-14 11:30:00',
  TIMESTAMP '2026-07-15 15:00:00'
),
(
  'REP-2004',
  'customer-008',
  'Gibson Les Paul Studio',
  'Gibson',
  'Needs fret polishing and setup.',
  'completed',
  'Completed before weekend session.',
  400000,
  'Bekzod U.',
  TIMESTAMP '2026-07-16 10:00:00',
  TIMESTAMP '2026-07-16 10:20:00',
  TIMESTAMP '2026-07-17 18:00:00'
),
(
  'REP-2005',
  'customer-010',
  'Yamaha P-125',
  'Yamaha',
  'Middle register has a rattling key.',
  'in_progress',
  'Parts ordered for keybed inspection.',
  310000,
  'Dilshod M.',
  TIMESTAMP '2026-07-17 08:30:00',
  TIMESTAMP '2026-07-17 09:00:00',
  TIMESTAMP '2026-07-18 14:45:00'
);

INSERT INTO "Activity" (
  "id", "title", "messageKey", "messageParams", "timestamp"
) VALUES
(
  'activity-order-ord-1001',
  'activity.orderMoved',
  'activity.orderMoved',
  '{"orderId":"ORD-1001","status":"confirmed"}'::jsonb,
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'activity-repair-created-rep-2001',
  'activity.repairCreated',
  'activity.repairCreated',
  '{"repairId":"REP-2001","customerId":"customer-001"}'::jsonb,
  TIMESTAMP '2026-07-09 10:00:00'
),
(
  'activity-order-created-ord-1002',
  'activity.orderCreated',
  'activity.orderCreated',
  '{"orderId":"ORD-1002","customerId":"customer-002"}'::jsonb,
  TIMESTAMP '2026-07-10 11:30:00'
),
(
  'activity-repair-created-rep-2002',
  'activity.repairCreated',
  'activity.repairCreated',
  '{"repairId":"REP-2002","customerId":"customer-004"}'::jsonb,
  TIMESTAMP '2026-07-12 10:30:00'
),
(
  'activity-order-created-ord-1003',
  'activity.orderCreated',
  'activity.orderCreated',
  '{"orderId":"ORD-1003","customerId":"customer-004"}'::jsonb,
  TIMESTAMP '2026-07-12 15:10:00'
),
(
  'activity-order-created-ord-1004',
  'activity.orderCreated',
  'activity.orderCreated',
  '{"orderId":"ORD-1004","customerId":"customer-006"}'::jsonb,
  TIMESTAMP '2026-07-13 09:15:00'
),
(
  'activity-repair-created-rep-2003',
  'activity.repairCreated',
  'activity.repairCreated',
  '{"repairId":"REP-2003","customerId":"customer-007"}'::jsonb,
  TIMESTAMP '2026-07-14 11:30:00'
),
(
  'activity-repair-created-rep-2004',
  'activity.repairCreated',
  'activity.repairCreated',
  '{"repairId":"REP-2004","customerId":"customer-008"}'::jsonb,
  TIMESTAMP '2026-07-16 10:20:00'
),
(
  'activity-order-created-ord-1005',
  'activity.orderCreated',
  'activity.orderCreated',
  '{"orderId":"ORD-1005","customerId":"customer-008"}'::jsonb,
  TIMESTAMP '2026-07-16 14:20:00'
),
(
  'activity-repair-created-rep-2005',
  'activity.repairCreated',
  'activity.repairCreated',
  '{"repairId":"REP-2005","customerId":"customer-010"}'::jsonb,
  TIMESTAMP '2026-07-17 09:00:00'
),
(
  'activity-order-created-ord-1006',
  'activity.orderCreated',
  'activity.orderCreated',
  '{"orderId":"ORD-1006","customerId":"customer-009"}'::jsonb,
  TIMESTAMP '2026-07-18 12:00:00'
),
(
  'activity-inventory-restock-product-shure-sm7b',
  'activity.inventoryAdjusted',
  'activity.inventoryAdjusted',
  '{"productId":"product-shure-sm7b","delta":3}'::jsonb,
  TIMESTAMP '2026-07-21 09:00:00'
),
(
  'activity-inventory-audit-product-roland-spd-sx',
  'activity.inventoryAdjusted',
  'activity.inventoryAdjusted',
  '{"productId":"product-roland-spd-sx","delta":-1}'::jsonb,
  TIMESTAMP '2026-07-21 11:15:00'
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
