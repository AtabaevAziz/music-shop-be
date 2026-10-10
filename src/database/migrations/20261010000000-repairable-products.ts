import { MigrationInterface, QueryRunner } from "typeorm";

export class RepairableProducts20261010000000 implements MigrationInterface {
  name = "RepairableProducts20261010000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Product"
      ADD COLUMN "repairable" BOOLEAN NOT NULL DEFAULT false;

      ALTER TABLE "RepairRequest"
      ADD COLUMN "productId" TEXT,
      ADD COLUMN "variantId" TEXT;

      CREATE INDEX "RepairRequest_productId_idx"
        ON "RepairRequest" ("productId");
      CREATE INDEX "RepairRequest_variantId_idx"
        ON "RepairRequest" ("variantId");

      ALTER TABLE "RepairRequest"
        ADD CONSTRAINT "RepairRequest_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id")
        ON DELETE SET NULL;

      ALTER TABLE "RepairRequest"
        ADD CONSTRAINT "RepairRequest_variantId_fkey"
        FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
        ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "RepairRequest"
        DROP CONSTRAINT "RepairRequest_variantId_fkey";
      ALTER TABLE "RepairRequest"
        DROP CONSTRAINT "RepairRequest_productId_fkey";
      DROP INDEX "RepairRequest_variantId_idx";
      DROP INDEX "RepairRequest_productId_idx";
      ALTER TABLE "RepairRequest"
        DROP COLUMN "variantId",
        DROP COLUMN "productId";
      ALTER TABLE "Product" DROP COLUMN "repairable";
    `);
  }
}
