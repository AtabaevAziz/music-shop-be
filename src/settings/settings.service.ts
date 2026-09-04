import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductStatus } from "../common/enums/product-status.enum";
import { BusinessSettingsEntity } from "../database/entities";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(BusinessSettingsEntity)
    private readonly settingsRepository: Repository<BusinessSettingsEntity>,
  ) {}

  async getSettings(): Promise<{
    currency: string;
    lowStockThreshold: number;
    defaultProductStatus: string;
    defaultMarkupPercent: number;
  }> {
    const settings = await this.ensureSettings();

    return {
      currency: settings.currency,
      lowStockThreshold: settings.lowStockThreshold,
      defaultProductStatus: settings.defaultProductStatus,
      defaultMarkupPercent: Number(settings.defaultMarkupPercent),
    };
  }

  async updateSettings(payload: UpdateSettingsDto): Promise<{
    currency: string;
    lowStockThreshold: number;
    defaultProductStatus: string;
    defaultMarkupPercent: number;
  }> {
    const normalizedCurrency = payload.currency.trim().toUpperCase();

    const current = await this.ensureSettings();
    const settings = await this.settingsRepository.save({
      ...current,
      currency: normalizedCurrency,
      lowStockThreshold: payload.lowStockThreshold,
      defaultProductStatus: payload.defaultProductStatus,
      defaultMarkupPercent: payload.defaultMarkupPercent,
    });

    return {
      currency: settings.currency,
      lowStockThreshold: settings.lowStockThreshold,
      defaultProductStatus: settings.defaultProductStatus,
      defaultMarkupPercent: Number(settings.defaultMarkupPercent),
    };
  }

  private async ensureSettings(): Promise<BusinessSettingsEntity> {
    const existing = await this.settingsRepository.findOneBy({
      id: "business-settings",
    });

    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({
        id: "business-settings",
        currency: "UZS",
        lowStockThreshold: 3,
        defaultProductStatus: ProductStatus.Draft,
        defaultMarkupPercent: 28,
      }),
    );
  }
}
