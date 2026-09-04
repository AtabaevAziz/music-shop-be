import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception';
import { Condition } from '../common/enums/condition.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { createId } from '../common/utils/id.util';
import { normalizeMediaPath } from '../common/utils/media.util';
import { slugify } from '../common/utils/slug.util';
import { isAbsolutePathOrUrl } from '../common/utils/url.util';
import { CategoryEntity, ProductEntity } from '../database/entities';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductWire = {
  id: string;
  name: string;
  slug?: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  brand: string;
  price: number;
  costPrice: number;
  stockQty: number;
  reservedQty: number;
  availableQty: number;
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
  slug?: string;
  sku: string;
  price: number;
  stockQty: number;
  reservedQty: number;
  availableQty: number;
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

type ProductWithRelations = ProductEntity & {
  category: CategoryEntity;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>
  ) {}

  async listProducts(filters: ProductFilters = {}): Promise<ProductWire[]> {
    const query = this.productRepository.createQueryBuilder('product');

    if (filters.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.brand) {
      query.andWhere('LOWER(product.brand) = LOWER(:brand)', { brand: filters.brand });
    }

    if (filters.search) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('product.name ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('product.sku ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('product.brand ILIKE :search', { search: `%${filters.search}%` });
        })
      );
    }

    const products = await query.orderBy('product.name', 'ASC').getMany();

    return products.map((product) => this.toWire(product));
  }

  async listClientProducts(): Promise<ProductWire[]> {
    return this.listProducts({ status: ProductStatus.Active });
  }

  async listPublicProducts(filters: Pick<ProductFilters, 'search'> = {}): Promise<PublicProductWire[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.Active });

    if (filters.search) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('product.name ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('product.sku ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('product.shortDescription ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('product.brand ILIKE :search', { search: `%${filters.search}%` });
        })
      );
    }

    const products = await query.orderBy('product.name', 'ASC').getMany();

    return products.map((product) => this.toPublicWire(product as ProductWithRelations));
  }

  async getPublicProduct(id: string): Promise<PublicProductWire> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        status: ProductStatus.Active
      },
      relations: {
        category: true
      }
    });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    return this.toPublicWire(product as ProductWithRelations);
  }

  async getProduct(id: string): Promise<ProductWire> {
    const product = await this.productRepository.findOneBy({ id });

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

    const product = await this.productRepository.save(
      this.productRepository.create({
        id: createId('product'),
        name: payload.name.trim(),
        slug: slugify(payload.name),
        sku: payload.sku.trim(),
        barcode: this.normalizeNullableText(payload.barcode),
        categoryId: payload.categoryId,
        brand: payload.brand.trim(),
        price: payload.price,
        costPrice: payload.costPrice,
        stockQty: payload.stockQty,
        reservedQty: 0,
        minStockQty: payload.minStockQty,
        status: payload.status,
        shortDescription: payload.shortDescription.trim(),
        description: payload.description.trim(),
        specs: payload.specs,
        images,
        primaryImage,
        condition: payload.condition
      })
    );

    return this.toWire(product);
  }

  async updateProduct(id: string, payload: UpdateProductDto): Promise<ProductWire> {
    const existing = await this.productRepository.findOneBy({ id });

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

    const product = await this.productRepository.save({
      ...existing,
      name: payload.name?.trim() ?? existing.name,
      slug: payload.name?.trim() ? slugify(payload.name) : existing.slug,
      sku: payload.sku?.trim() ?? existing.sku,
      barcode:
        payload.barcode === undefined
          ? existing.barcode
          : this.normalizeNullableText(payload.barcode),
      categoryId: payload.categoryId ?? existing.categoryId,
      brand: payload.brand?.trim() ?? existing.brand,
      price: payload.price ?? existing.price,
      costPrice: payload.costPrice ?? existing.costPrice,
      stockQty: payload.stockQty ?? existing.stockQty,
      minStockQty: payload.minStockQty === undefined ? existing.minStockQty : payload.minStockQty,
      status: payload.status ?? existing.status,
      shortDescription: payload.shortDescription?.trim() ?? existing.shortDescription,
      description: payload.description?.trim() ?? existing.description,
      specs: payload.specs ?? existing.specs,
      images: nextImages,
      primaryImage: nextPrimaryImage,
      condition: payload.condition ?? existing.condition
    });

    return this.toWire(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        inventoryMoves: true,
        orderItems: true
      }
    });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    if (product.inventoryMoves.length > 0 || product.orderItems.length > 0) {
      throw ApiException.conflict('Product cannot be deleted while linked orders or inventory movements exist.');
    }

    await this.productRepository.delete({ id });
  }

  async addImage(id: string, payload: ProductImageDto): Promise<{ id: string; images: string[]; primaryImage: string | null }> {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    const image = this.normalizeImagePath(payload.image);
    this.assertImageValue(image);

    const images = this.normalizeImageList(product.images);

    if (images.includes(image)) {
      throw ApiException.conflict('Product image already exists.', 'image');
    }

    const updated = await this.productRepository.save({
      ...product,
      images: [...images, image],
      primaryImage: product.primaryImage
        ? this.normalizeImagePath(product.primaryImage)
        : null
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
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw ApiException.notFound('Product was not found.');
    }

    const image = this.normalizeImagePath(payload.image);
    const images = this.normalizeImageList(product.images);

    if (!images.includes(image)) {
      throw ApiException.validation('Primary image must belong to this product.', 'image');
    }

    const updated = await this.productRepository.save({
      ...product,
      images,
      primaryImage: image
    });

    return {
      id: updated.id,
      primaryImage: updated.primaryImage
        ? this.normalizeImagePath(updated.primaryImage)
        : null
    };
  }

  async getActiveProductsByIds(productIds: string[]): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: {
        id: In(productIds),
        status: ProductStatus.Active
      }
    });
  }

  private async assertUniqueSku(sku: string, productId?: string): Promise<void> {
    const existing = await this.productRepository.findOneBy({ sku: sku.trim() });

    if (existing && existing.id !== productId) {
      throw ApiException.conflict('Product SKU must be unique.', 'sku');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOneBy({ id: categoryId });

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

  private toWire(product: ProductEntity): ProductWire {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug ?? undefined,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      brand: product.brand,
      price: product.price,
      costPrice: product.costPrice,
      stockQty: product.stockQty,
      reservedQty: product.reservedQty,
      availableQty: product.stockQty - product.reservedQty,
      minStockQty: product.minStockQty ?? undefined,
      status: product.status,
      shortDescription: product.shortDescription,
      description: product.description,
      specs: product.specs,
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
      slug: product.slug ?? undefined,
      sku: product.sku,
      price: product.price,
      stockQty: product.stockQty,
      reservedQty: product.reservedQty,
      availableQty: product.stockQty - product.reservedQty,
      shortDescription: product.shortDescription,
      description: product.description,
      specs: product.specs,
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
