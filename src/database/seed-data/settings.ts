import { ProductStatus } from '../../common/enums/product-status.enum';

export const businessSettingsSeed = {
  id: 'business-settings',
  currency: 'UZS',
  lowStockThreshold: 3,
  defaultProductStatus: ProductStatus.Draft,
  defaultMarkupPercent: 28,
  createdAt: new Date('2026-07-09T10:00:00.000Z'),
  updatedAt: new Date('2026-07-09T10:00:00.000Z')
} as const;
