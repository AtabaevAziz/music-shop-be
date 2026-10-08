import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderNumberSequence20261008000000 implements MigrationInterface {
  name = "OrderNumberSequence20261008000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "Order_orderNumber_seq" START WITH 1001;
      SELECT setval(
        '"Order_orderNumber_seq"',
        GREATEST(
          1000,
          COALESCE(
            (SELECT MAX((regexp_replace("orderNumber", '\\D', '', 'g'))::integer) FROM "Order"),
            1000
          )
        ),
        true
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Payment_transactionId_unique_idx"
        ON "Payment" ("transactionId")
        WHERE "transactionId" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "Payment_transactionId_unique_idx"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "Order_orderNumber_seq"`);
  }
}
