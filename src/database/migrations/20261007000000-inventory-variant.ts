import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryVariant20261007000000 implements MigrationInterface {
  name = "InventoryVariant20261007000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "InventoryMovement" ADD COLUMN "variantId" TEXT;
      ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey"
        FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT;
      CREATE INDEX "InventoryMovement_variantId_idx" ON "InventoryMovement" ("variantId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "InventoryMovement_variantId_idx"`);
    await queryRunner.query(`ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_variantId_fkey"`);
    await queryRunner.query(`ALTER TABLE "InventoryMovement" DROP COLUMN "variantId"`);
  }
}
