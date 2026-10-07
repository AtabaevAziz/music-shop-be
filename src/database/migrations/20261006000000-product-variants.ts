import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductVariants20261006000000 implements MigrationInterface {
  name = "ProductVariants20261006000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ProductVariant" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "colorKey" TEXT NOT NULL,
        "colorName" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "barcode" TEXT,
        "price" INTEGER NOT NULL,
        "costPrice" INTEGER NOT NULL,
        "stockQty" INTEGER NOT NULL,
        "reservedQty" INTEGER NOT NULL DEFAULT 0,
        "minStockQty" INTEGER,
        "status" "ProductStatus" NOT NULL,
        "images" TEXT[] NOT NULL,
        "primaryImage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ProductVariant_sku_key" UNIQUE ("sku"),
        CONSTRAINT "ProductVariant_product_color_key" UNIQUE ("productId", "colorKey"),
        CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );
      CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant" ("productId");
      ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
      ALTER TABLE "OrderItem" ADD COLUMN "variantName" TEXT;
      ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
        FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT;
      CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem" ("variantId");
    `);

    await queryRunner.query(`
      INSERT INTO "ProductVariant" (
        "id", "productId", "colorKey", "colorName", "sku", "barcode",
        "price", "costPrice", "stockQty", "reservedQty", "minStockQty",
        "status", "images", "primaryImage"
      )
      SELECT
        'variant-' || "id", "id", 'default', 'Default', "sku", "barcode",
        "price", "costPrice", "stockQty", "reservedQty", "minStockQty",
        "status", "images", "primaryImage"
      FROM "Product";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "OrderItem_variantId_idx"`);
    await queryRunner.query(`ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey"`);
    await queryRunner.query(`ALTER TABLE "OrderItem" DROP COLUMN "variantName"`);
    await queryRunner.query(`ALTER TABLE "OrderItem" DROP COLUMN "variantId"`);
    await queryRunner.query(`DROP INDEX "ProductVariant_productId_idx"`);
    await queryRunner.query(`DROP TABLE "ProductVariant"`);
  }
}
