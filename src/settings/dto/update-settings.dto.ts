import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsString, Length, Min } from 'class-validator';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class UpdateSettingsDto {
  @IsString()
  @Length(3, 3)
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
