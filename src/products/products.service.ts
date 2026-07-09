import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
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
  brandId: string;
  price: number;
  costPrice: number;
  stockQty: number;
  status: string;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  primaryImage: string | null;
  condition: string;
};

type ProductFilters = {
  status?: string;
  categoryId?: string;
  brandId?: string;
  search?: string;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(filters: ProductFilters = {}): Promise<ProductWire[]> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.brandId ? { brandId: filters.brandId } : {}),
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } }
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
    await this.assertBrandExists(payload.brandId);
    this.assertValidSpecs(payload.specs);
    this.assertValidImages(payload.images, payload.primaryImage);

    const product = await this.prisma.product.create({
      data: {
        id: createId('product'),
        name: payload.name.trim(),
        sku: payload.sku.trim(),
        barcode: payload.barcode?.trim() ?? null,
        categoryId: payload.categoryId,
        brandId: payload.brandId,
        price: payload.price,
        costPrice: payload.costPrice,
        stockQty: payload.stockQty,
        status: payload.status as never,
        shortDescription: payload.shortDescription.trim(),
        description: payload.description.trim(),
        specs: payload.specs,
        images: payload.images,
        primaryImage: payload.primaryImage ?? payload.images[0],
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

    if (payload.brandId) {
      await this.assertBrandExists(payload.brandId);
    }

    if (payload.specs) {
      this.assertValidSpecs(payload.specs);
    }

    const nextImages = payload.images ?? existing.images;
    const nextPrimaryImage = payload.primaryImage ?? existing.primaryImage ?? nextImages[0] ?? null;
    this.assertValidImages(nextImages, nextPrimaryImage ?? undefined);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        sku: payload.sku?.trim(),
        barcode: payload.barcode === undefined ? undefined : payload.barcode.trim(),
        categoryId: payload.categoryId,
        brandId: payload.brandId,
        price: payload.price,
        costPrice: payload.costPrice,
        stockQty: payload.stockQty,
        status: payload.status as never,
        shortDescription: payload.shortDescription?.trim(),
        description: payload.description?.trim(),
        specs: payload.specs as Prisma.InputJsonValue | undefined,
        images: payload.images,
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

    const image = payload.image.trim();
    this.assertImageValue(image);

    if (product.images.includes(image)) {
      throw ApiException.conflict('Product image already exists.', 'image');
    }

    const images = [...product.images, image];
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        images
      }
    });

    return {
      id: updated.id,
      images: updated.images,
      primaryImage: updated.primaryImage
    };
  }

  async setPrimaryImage(id: string, payload: ProductImageDto): Promise<{ id: string; primaryImage: string | null }> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    const image = payload.image.trim();

    if (!product.images.includes(image)) {
      throw ApiException.validation('Primary image must belong to this product.', 'image');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        primaryImage: image
      }
    });

    return {
      id: updated.id,
      primaryImage: updated.primaryImage
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

  private async assertBrandExists(brandId: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });

    if (!brand) {
      throw ApiException.validation('Brand must exist.', 'brandId');
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
      brandId: product.brandId,
      price: product.price,
      costPrice: product.costPrice,
      stockQty: product.stockQty,
      status: product.status,
      shortDescription: product.shortDescription,
      description: product.description,
      specs: product.specs as Record<string, string>,
      images: product.images,
      primaryImage: product.primaryImage,
      condition: product.condition
    };
  }
}
