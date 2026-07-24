import { Injectable } from '@nestjs/common';
import { Condition, Prisma, Product } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { normalizeMediaPath } from '../common/utils/media.util';
import { isAbsolutePathOrUrl } from '../common/utils/url.util';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductWire = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  brand: string;
  price: number;
  costPrice: number;
  stockQty: number;
  minStockQty?: number;
  status: string;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  primaryImage: string | null;
  condition: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProductFilters = {
  status?: string;
  categoryId?: string;
  brand?: string;
  search?: string;
};

type PublicProductWire = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  primaryImage: string | null;
  condition: Condition;
  category: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
  brand: string;
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
  };
}>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(filters: ProductFilters = {}): Promise<ProductWire[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.brand
          ? { brand: { equals: filters.brand, mode: 'insensitive' } }
          : {}),
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { brand: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      orderBy: [{ name: 'asc' }]
    });

    return products.map((product) => this.toWire(product));
  }

  async listClientProducts(): Promise<ProductWire[]> {
    return this.listProducts({ status: 'active' });
  }

  async listPublicProducts(filters: Pick<ProductFilters, 'search'> = {}): Promise<PublicProductWire[]> {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { shortDescription: { contains: filters.search, mode: 'insensitive' } },
                { brand: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          : {})
      },
      include: {
        category: true
      },
      orderBy: [{ name: 'asc' }]
    });

    return products.map((product) => this.toPublicWire(product));
  }

  async getPublicProduct(id: string): Promise<PublicProductWire> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'active'
      },
      include: {
        category: true
      }
    });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    return this.toPublicWire(product);
  }

  async getProduct(id: string): Promise<ProductWire> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    return this.toWire(product);
  }

  async createProduct(payload: CreateProductDto): Promise<ProductWire> {
    await this.assertUniqueSku(payload.sku);
    await this.assertCategoryExists(payload.categoryId);
    this.assertValidSpecs(payload.specs);
    const images = this.normalizeImageList(payload.images);
    const primaryImage = this.resolvePrimaryImage(payload.primaryImage, images);
    this.assertValidImages(images, primaryImage ?? undefined);

    const product = await this.prisma.product.create({
      data: {
        id: createId('product'),
        name: payload.name.trim(),
        sku: payload.sku.trim(),
        barcode: this.normalizeNullableText(payload.barcode),
        categoryId: payload.categoryId,
        brand: payload.brand.trim(),
        price: payload.price,
        costPrice: payload.costPrice,
        stockQty: payload.stockQty,
        minStockQty: payload.minStockQty,
        status: payload.status as never,
        shortDescription: payload.shortDescription.trim(),
        description: payload.description.trim(),
        specs: payload.specs,
        images,
        primaryImage,
        condition: payload.condition as never
      }
    });

    return this.toWire(product);
  }

  async updateProduct(id: string, payload: UpdateProductDto): Promise<ProductWire> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw ApiException.notFound('Product was not found.');
    }

    if (payload.sku) {
      await this.assertUniqueSku(payload.sku, existing.id);
    }

    if (payload.categoryId) {
      await this.assertCategoryExists(payload.categoryId);
    }

    if (payload.specs) {
      this.assertValidSpecs(payload.specs);
    }

    const nextImages = this.normalizeImageList(payload.images ?? existing.images);
    const nextPrimaryImage = this.resolvePrimaryImage(
      payload.primaryImage === undefined ? existing.primaryImage : payload.primaryImage,
      nextImages
    );
    this.assertValidImages(nextImages, nextPrimaryImage ?? undefined);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        sku: payload.sku?.trim(),
        barcode:
          payload.barcode === undefined
            ? undefined
            : this.normalizeNullableText(payload.barcode),
        categoryId: payload.categoryId,
        brand: payload.brand?.trim(),
        price: payload.price,
        costPrice: payload.costPrice,
        stockQty: payload.stockQty,
        minStockQty: payload.minStockQty,
        status: payload.status as never,
        shortDescription: payload.shortDescription?.trim(),
        description: payload.description?.trim(),
        specs: payload.specs as Prisma.InputJsonValue | undefined,
        images: nextImages,
        primaryImage: nextPrimaryImage,
        condition: payload.condition as never
      }
    });

    return this.toWire(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        inventoryMoves: { select: { id: true }, take: 1 },
        orderItems: { select: { id: true }, take: 1 }
      }
    });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    if (product.inventoryMoves.length > 0 || product.orderItems.length > 0) {
      throw ApiException.conflict('Product cannot be deleted while linked orders or inventory movements exist.');
    }

    await this.prisma.product.delete({ where: { id } });
  }

  async addImage(id: string, payload: ProductImageDto): Promise<{ id: string; images: string[]; primaryImage: string | null }> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    const image = this.normalizeImagePath(payload.image);
    this.assertImageValue(image);

    const images = this.normalizeImageList(product.images);

    if (images.includes(image)) {
      throw ApiException.conflict('Product image already exists.', 'image');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        images: [...images, image],
        primaryImage: product.primaryImage
          ? this.normalizeImagePath(product.primaryImage)
          : null
      }
    });

    return {
      id: updated.id,
      images: this.normalizeImageList(updated.images),
      primaryImage: updated.primaryImage
        ? this.normalizeImagePath(updated.primaryImage)
        : null
    };
  }

  async setPrimaryImage(id: string, payload: ProductImageDto): Promise<{ id: string; primaryImage: string | null }> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    const image = this.normalizeImagePath(payload.image);
    const images = this.normalizeImageList(product.images);

    if (!images.includes(image)) {
      throw ApiException.validation('Primary image must belong to this product.', 'image');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        images,
        primaryImage: image
      }
    });

    return {
      id: updated.id,
      primaryImage: updated.primaryImage
        ? this.normalizeImagePath(updated.primaryImage)
        : null
    };
  }

  async getActiveProductsByIds(productIds: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'active'
      }
    });
  }

  private async assertUniqueSku(sku: string, productId?: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { sku: sku.trim() }
    });

    if (existing && existing.id !== productId) {
      throw ApiException.conflict('Product SKU must be unique.', 'sku');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      throw ApiException.validation('Category must exist.', 'categoryId');
    }
  }

  private assertValidSpecs(specs: Record<string, string>): void {
    for (const [key, value] of Object.entries(specs)) {
      if (!key.trim() || !String(value).trim()) {
        throw ApiException.validation('All product specs must have non-empty keys and values.', 'specs');
      }
    }
  }

  private assertImageValue(image: string): void {
    if (!isAbsolutePathOrUrl(image)) {
      throw ApiException.validation('Product image must be an absolute path or URL.', 'image');
    }
  }

  private normalizeImagePath(image: string): string {
    return normalizeMediaPath(image);
  }

  private normalizeNullableText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue === '' ? null : trimmedValue;
  }

  private normalizeImageList(images: string[]): string[] {
    return images.map((image) => this.normalizeImagePath(image));
  }

  private resolvePrimaryImage(
    primaryImage: string | null | undefined,
    images: string[]
  ): string | null {
    if (primaryImage === undefined || primaryImage === null || primaryImage.trim() === '') {
      return images[0] ?? null;
    }

    return this.normalizeImagePath(primaryImage);
  }

  private assertValidImages(images: string[], primaryImage?: string): void {
    if (images.length === 0) {
      throw ApiException.validation('Product must include at least one image.', 'images');
    }

    images.forEach((image) => this.assertImageValue(image));

    const resolvedPrimaryImage = primaryImage ?? images[0];

    if (!images.includes(resolvedPrimaryImage)) {
      throw ApiException.validation('Primary image must belong to the product images list.', 'primaryImage');
    }
  }

  private toWire(product: Product): ProductWire {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      brand: product.brand,
      price: product.price,
      costPrice: product.costPrice,
      stockQty: product.stockQty,
      minStockQty: product.minStockQty ?? undefined,
      status: product.status,
      shortDescription: product.shortDescription,
      description: product.description,
      specs: product.specs as Record<string, string>,
      images: this.normalizeImageList(product.images),
      primaryImage: product.primaryImage
        ? this.normalizeImagePath(product.primaryImage)
        : null,
      condition: product.condition,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  private toPublicWire(product: ProductWithRelations): PublicProductWire {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stockQty: product.stockQty,
      shortDescription: product.shortDescription,
      description: product.description,
      specs: product.specs as Record<string, string>,
      images: this.normalizeImageList(product.images),
      primaryImage: product.primaryImage
        ? this.normalizeImagePath(product.primaryImage)
        : null,
      condition: product.condition,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        image: this.normalizeImagePath(product.category.image)
      },
      brand: product.brand
    };
  }
}
