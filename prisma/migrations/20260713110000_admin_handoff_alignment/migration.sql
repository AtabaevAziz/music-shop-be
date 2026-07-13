ALTER TABLE "Customer"
ADD COLUMN "fullName" TEXT;

ALTER TABLE "Product"
ADD COLUMN "minStockQty" INTEGER;

ALTER TABLE "RepairRequest"
ADD COLUMN "estimatedCost" INTEGER,
ADD COLUMN "assignedMasterName" TEXT,
ADD COLUMN "receivedAt" TIMESTAMP(3);
