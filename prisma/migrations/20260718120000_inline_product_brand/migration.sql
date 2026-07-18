ALTER TABLE "Product" ADD COLUMN "brand" TEXT;

UPDATE "Product" AS "p"
SET "brand" = "b"."name"
FROM "Brand" AS "b"
WHERE "p"."brandId" = "b"."id";

ALTER TABLE "Product" ALTER COLUMN "brand" SET NOT NULL;

CREATE INDEX "Product_brand_idx" ON "Product"("brand");

ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";
DROP INDEX "Product_brandId_idx";
ALTER TABLE "Product" DROP COLUMN "brandId";

DROP TABLE "Brand";
