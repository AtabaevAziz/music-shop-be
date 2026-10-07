import "dotenv/config";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DataSource } from "typeorm";
import {
  CategoryEntity,
  ProductEntity,
  ProductVariantEntity,
} from "../src/database/entities";
import AppDataSource from "../src/database/typeorm.datasource";

const frontendAssets = join(dirname(__dirname), "..", "music-shop-fe", "public", "assets");
const assetPattern = /^split-(?<family>[a-f0-9-]+)-(?<index>\d+)\.png$/;
const importCategoryId = "category-imported-assets";

function assetPath(fileName: string) {
  return `/assets/${fileName}`;
}

function slugPart(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

async function ensureImportCategory(dataSource: DataSource) {
  const repository = dataSource.getRepository(CategoryEntity);
  await repository.upsert(
    {
      id: importCategoryId,
      name: "Imported Instruments",
      slug: "imported-instruments",
      parentId: null,
      image: "/assets/split-1c18797c-f2fd-407a-89ab-10b9129d57c5-01.png",
      status: "inactive",
      description: "Draft category for imported artwork awaiting merchandising review.",
    },
    ["id"],
  );
}

async function importAssets(dataSource: DataSource) {
  const files = (await readdir(frontendAssets))
    .filter((fileName) => assetPattern.test(fileName))
    .sort();

  if (files.length !== 160) {
    throw new Error(`Expected 160 split assets, found ${files.length}.`);
  }

  const grouped = new Map<string, string[]>();
  for (const fileName of files) {
    const match = assetPattern.exec(fileName);
    if (!match?.groups?.family) {
      throw new Error(`Invalid imported asset filename: ${fileName}`);
    }
    const family = match.groups.family;
    grouped.set(family, [...(grouped.get(family) ?? []), fileName]);
  }

  const productRepository = dataSource.getRepository(ProductEntity);
  const variantRepository = dataSource.getRepository(ProductVariantEntity);

  for (const [family, familyFiles] of grouped) {
    const familySlug = slugPart(family);
    const productId = `product-import-${familySlug}`;
    const firstImage = assetPath(familyFiles[0]);

    await productRepository.upsert(
      {
        id: productId,
        name: `Imported instrument collection ${familySlug.slice(0, 8)}`,
        slug: productId,
        sku: `IMP-${familySlug.slice(0, 8).toUpperCase()}`,
        barcode: null,
        categoryId: importCategoryId,
        brand: "Unassigned",
        price: 1,
        costPrice: 1,
        stockQty: 0,
        reservedQty: 0,
        minStockQty: 0,
        status: "draft",
        shortDescription: "Imported artwork awaiting product classification.",
        description: "Complete the product name, brand, category, price, stock and color data in the catalog admin.",
        specs: { sourceFamily: family },
        images: [firstImage],
        primaryImage: firstImage,
        condition: "new",
      },
      ["id"],
    );

    for (const [position, fileName] of familyFiles.entries()) {
      const image = assetPath(fileName);
      const variantId = `variant-import-${familySlug}-${String(position + 1).padStart(3, "0")}`;
      await variantRepository.upsert(
        {
          id: variantId,
          productId,
          colorKey: `asset-${String(position + 1).padStart(3, "0")}`,
          colorName: `Imported color ${position + 1}`,
          sku: `IMP-${familySlug.slice(0, 8).toUpperCase()}-${String(position + 1).padStart(3, "0")}`,
          barcode: null,
          price: 1,
          costPrice: 1,
          stockQty: 0,
          reservedQty: 0,
          minStockQty: 0,
          status: "draft",
          images: [image],
          primaryImage: image,
        },
        ["id"],
      );
    }

    const importedVariants = await variantRepository.find({ where: { productId } });
    const expectedVariantIds = new Set(
      familyFiles.map((_, position) =>
        `variant-import-${familySlug}-${String(position + 1).padStart(3, "0")}`,
      ),
    );
    const staleVariantIds = importedVariants
      .filter((variant) => variant.id.startsWith("variant-import-") && !expectedVariantIds.has(variant.id))
      .map((variant) => variant.id);
    if (staleVariantIds.length > 0) {
      await variantRepository.delete(staleVariantIds);
    }
  }

  console.info(`Imported ${files.length} assets into ${grouped.size} draft product families.`);
}

async function main() {
  await AppDataSource.initialize();
  try {
    await ensureImportCategory(AppDataSource);
    await importAssets(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
