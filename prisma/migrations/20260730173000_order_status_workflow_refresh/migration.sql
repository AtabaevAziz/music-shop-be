ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'processing';

ALTER TYPE "PackagingStatus" ADD VALUE IF NOT EXISTS 'ready_for_shipment';

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

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

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"::text
      WHEN 'awaiting_payment' THEN 'new'
      WHEN 'paid' THEN 'confirmed'
      WHEN 'processing' THEN 'packing'
      ELSE "status"::text
    END
  )::"OrderStatus";

ALTER TABLE "OrderStatusHistory"
  ALTER COLUMN "oldStatus" TYPE "OrderStatus"
  USING (
    CASE "oldStatus"::text
      WHEN 'awaiting_payment' THEN 'new'
      WHEN 'paid' THEN 'confirmed'
      WHEN 'processing' THEN 'packing'
      ELSE "oldStatus"::text
    END
  )::"OrderStatus";

ALTER TABLE "OrderStatusHistory"
  ALTER COLUMN "newStatus" TYPE "OrderStatus"
  USING (
    CASE "newStatus"::text
      WHEN 'awaiting_payment' THEN 'new'
      WHEN 'paid' THEN 'confirmed'
      WHEN 'processing' THEN 'packing'
      ELSE "newStatus"::text
    END
  )::"OrderStatus";

DROP TYPE "OrderStatus_old";
