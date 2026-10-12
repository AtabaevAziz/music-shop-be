import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderIntegrity20261012000000 implements MigrationInterface {
  name = "OrderIntegrity20261012000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'return'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value safely in place.
  }
}
