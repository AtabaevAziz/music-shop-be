import { Injectable } from '@nestjs/common';
import { Brand } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { createId } from '../common/utils/id.util';
import { slugify } from '../common/utils/slug.util';
import { PrismaService } from '../database/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

type BrandWire = {
  id: string;
  name: string;
  country: string;
  website: string;
  status: string;
};

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBrands(): Promise<BrandWire[]> {
    const brands = await this.prisma.brand.findMany({
      orderBy: [{ name: 'asc' }]
    });

    return brands.map((brand) => this.toWire(brand));
  }

  async createBrand(payload: CreateBrandDto): Promise<BrandWire> {
    await this.assertUniqueName(payload.name);
    const brandSlug = slugify(payload.name);

    if (!brandSlug) {
      throw ApiException.validation('Brand name must contain letters or numbers.', 'name');
    }

    const brand = await this.prisma.brand.create({
      data: {
        id: createId('brand', brandSlug),
        name: payload.name.trim(),
        country: payload.country.trim(),
        website: payload.website.trim(),
        status: payload.status.trim()
      }
    });

    return this.toWire(brand);
  }

  async updateBrand(id: string, payload: UpdateBrandDto): Promise<BrandWire> {
    const existing = await this.prisma.brand.findUnique({ where: { id } });

    if (!existing) {
      throw ApiException.notFound('Brand was not found.');
    }

    if (payload.name) {
      await this.assertUniqueName(payload.name, existing.id);
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        country: payload.country?.trim(),
        website: payload.website?.trim(),
        status: payload.status?.trim()
      }
    });

    return this.toWire(brand);
  }

  async deleteBrand(id: string): Promise<void> {
    const existing = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1
        }
      }
    });

    if (!existing) {
      throw ApiException.notFound('Brand was not found.');
    }

    if (existing.products.length > 0) {
      throw ApiException.conflict('Brand cannot be deleted while linked products exist.');
    }

    await this.prisma.brand.delete({ where: { id } });
  }

  private async assertUniqueName(name: string, brandId?: string): Promise<void> {
    const existing = await this.prisma.brand.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existing && existing.id !== brandId) {
      throw ApiException.conflict('Brand name must be unique.', 'name');
    }
  }

  private toWire(brand: Brand): BrandWire {
    return {
      id: brand.id,
      name: brand.name,
      country: brand.country,
      website: brand.website,
      status: brand.status
    };
  }
}
