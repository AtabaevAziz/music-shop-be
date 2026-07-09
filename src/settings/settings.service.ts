import { Injectable } from '@nestjs/common';
import { ProductStatus as PrismaProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<{
    currency: string;
    lowStockThreshold: number;
    defaultProductStatus: string;
    defaultMarkupPercent: number;
  }> {
    const settings = await this.prisma.businessSettings.upsert({
      where: { id: 'business-settings' },
      update: {},
      create: {
        id: 'business-settings',
        currency: 'UZS',
        lowStockThreshold: 3,
        defaultProductStatus: PrismaProductStatus.draft,
        defaultMarkupPercent: 28
      }
    });

    return {
      currency: settings.currency,
      lowStockThreshold: settings.lowStockThreshold,
      defaultProductStatus: settings.defaultProductStatus,
      defaultMarkupPercent: Number(settings.defaultMarkupPercent)
    };
  }

  async updateSettings(payload: UpdateSettingsDto): Promise<{
    currency: string;
    lowStockThreshold: number;
    defaultProductStatus: string;
    defaultMarkupPercent: number;
  }> {
    const settings = await this.prisma.businessSettings.upsert({
      where: { id: 'business-settings' },
      update: {
        currency: payload.currency.toUpperCase(),
        lowStockThreshold: payload.lowStockThreshold,
        defaultProductStatus: payload.defaultProductStatus as never,
        defaultMarkupPercent: payload.defaultMarkupPercent
      },
      create: {
        id: 'business-settings',
        currency: payload.currency.toUpperCase(),
        lowStockThreshold: payload.lowStockThreshold,
        defaultProductStatus: payload.defaultProductStatus as never,
        defaultMarkupPercent: payload.defaultMarkupPercent
      }
    });

    return {
      currency: settings.currency,
      lowStockThreshold: settings.lowStockThreshold,
      defaultProductStatus: settings.defaultProductStatus,
      defaultMarkupPercent: Number(settings.defaultMarkupPercent)
    };
  }
}
