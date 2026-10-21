import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderIdempotency20261013000000 implements MigrationInterface {
  name = "OrderIdempotency20261013000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "Order_idempotencyKey_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Order" DROP COLUMN IF EXISTS "idempotencyKey"`,
    );
  }
}
