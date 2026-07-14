UPDATE "Employee"
SET "role" = 'admin'
WHERE "role" IN ('store_manager', 'catalog_manager', 'sales_operator');

ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('admin', 'client');

ALTER TABLE "Employee"
  ALTER COLUMN "role" TYPE "Role"
  USING ("role"::text::"Role");

DROP TYPE "Role_old";
