import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsString, Min } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class UpdateSettingsDto {
  @IsString()
  currency!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold!: number;

  @IsEnum(ProductStatus)
  defaultProductStatus!: ProductStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultMarkupPercent!: number;
}

