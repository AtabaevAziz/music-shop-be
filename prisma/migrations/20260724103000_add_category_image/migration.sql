ALTER TABLE "Category"
ADD COLUMN "image" TEXT NOT NULL DEFAULT '/assets/grand-piano.png';

ALTER TABLE "Category"
ALTER COLUMN "image" DROP DEFAULT;
