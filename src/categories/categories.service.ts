import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { normalizeMediaPath } from '../common/utils/media.util';
import { slugify } from '../common/utils/slug.util';
import { isAbsolutePathOrUrl } from '../common/utils/url.util';
import { CategoryEntity } from '../database/entities';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryWire = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string;
  status: string;
  description: string;
  productCount: number;
};

type CategoryWithCount = CategoryEntity & {
  productCount: number;
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>
  ) {}

  async listCategories(): Promise<CategoryWire[]> {
    const categories = await this.categoryRepository.find({
      relations: {
        products: true
      },
      order: { name: 'ASC' }
    });

    return categories.map((category) =>
      this.toWire({
        ...category,
        productCount: category.products.length
      })
    );
  }

  async createCategory(payload: CreateCategoryDto): Promise<CategoryWire> {
    await this.assertValidParent(payload.parentId ?? null);

    const slug = await this.generateUniqueSlug(payload.name);
    const image = this.normalizeImagePath(payload.image);
    this.assertImageValue(image);
    const category = await this.categoryRepository.save(
      this.categoryRepository.create({
        id: createId('category', slug),
        name: payload.name.trim(),
        slug,
        parentId: payload.parentId ?? null,
        image,
        status: payload.status.trim(),
        description: payload.description.trim()
      })
    );

    return this.toWire(category);
  }

  async updateCategory(id: string, payload: UpdateCategoryDto): Promise<CategoryWire> {
    const existing = await this.categoryRepository.findOneBy({ id });

    if (!existing) {
      throw ApiException.notFound('Category was not found.');
    }

    const nextParentId = payload.parentId === undefined ? existing.parentId : payload.parentId;
    await this.assertValidParent(nextParentId ?? null, existing.id);
    await this.assertNoCycle(existing.id, nextParentId ?? null);

    const slug =
      payload.name && payload.name.trim() !== existing.name
        ? await this.generateUniqueSlug(payload.name, existing.id)
        : existing.slug;
    const image =
      payload.image === undefined
        ? this.normalizeImagePath(existing.image)
        : this.normalizeImagePath(payload.image);
    this.assertImageValue(image);

    const category = await this.categoryRepository.save({
      ...existing,
      name: payload.name?.trim() ?? existing.name,
      slug,
      parentId: nextParentId ?? null,
      image,
      status: payload.status?.trim() ?? existing.status,
      description: payload.description?.trim() ?? existing.description
    });

    return this.toWire(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        children: true,
        products: true
      }
    });

    if (!existing) {
      throw ApiException.notFound('Category was not found.');
    }

    if (existing.children.length > 0) {
      throw ApiException.conflict('Category cannot be deleted while it has child categories.');
    }

    if (existing.products.length > 0) {
      throw ApiException.conflict('Category cannot be deleted while linked products exist.');
    }

    await this.categoryRepository.delete({ id });
  }

  private async assertValidParent(parentId: string | null, selfId?: string): Promise<void> {
    if (!parentId) {
      return;
    }

    if (selfId && parentId === selfId) {
      throw ApiException.validation('Category cannot be a parent of itself.', 'parentId');
    }

    const parent = await this.categoryRepository.findOneBy({ id: parentId });

    if (!parent) {
      throw ApiException.validation('Parent category must exist.', 'parentId');
    }
  }

  private async assertNoCycle(categoryId: string, parentId: string | null): Promise<void> {
    let cursor = parentId;

    while (cursor) {
      if (cursor === categoryId) {
        throw ApiException.validation('Category parent creates a cycle.', 'parentId');
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: cursor },
        select: {
          parentId: true
        }
      });

      cursor = parent?.parentId ?? null;
    }
  }

  private async generateUniqueSlug(name: string, categoryId?: string): Promise<string> {
    const baseSlug = slugify(name);

    if (!baseSlug) {
      throw ApiException.validation('Category name must contain letters or numbers.', 'name');
    }

    let candidate = baseSlug;
    let sequence = 2;

    while (true) {
      const existing = await this.categoryRepository.findOneBy({ slug: candidate });

      if (!existing || existing.id === categoryId) {
        return candidate;
      }

      candidate = `${baseSlug}-${sequence}`;
      sequence += 1;
    }
  }

  private assertImageValue(image: string): void {
    if (!isAbsolutePathOrUrl(image)) {
      throw ApiException.validation('Category image must be an absolute path or URL.', 'image');
    }
  }

  private normalizeImagePath(image: string): string {
    return normalizeMediaPath(image);
  }

  private toWire(category: CategoryWithCount | CategoryEntity): CategoryWire {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      image: this.normalizeImagePath(category.image),
      status: category.status,
      description: category.description,
      productCount: 'productCount' in category ? category.productCount : 0
    };
  }
}
