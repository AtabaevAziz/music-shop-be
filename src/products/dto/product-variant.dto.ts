import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { ProductStatus } from "../../common/enums/product-status.enum";

export class ProductVariantDto {
  @IsString()
  @MinLength(2)
  colorKey!: string;

  @IsString()
  @MinLength(2)
  colorName!: string;

  @IsString()
  @MinLength(3)
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  costPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStockQty?: number;

  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsOptional()
  @IsString()
  primaryImage?: string;
}
