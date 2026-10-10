import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Condition } from "../../common/enums/condition.enum";
import { ProductStatus } from "../../common/enums/product-status.enum";
import { ProductVariantDto } from "./product-variant.dto";

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(3)
  sku!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  brand!: string;

  @IsOptional()
  repairable?: boolean;

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

  @IsString()
  @MinLength(4)
  shortDescription!: string;

  @IsString()
  @MinLength(4)
  description!: string;

  @IsObject()
  specs!: Record<string, string>;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images!: string[];

  @IsOptional()
  @IsString()
  primaryImage?: string;

  @IsEnum(Condition)
  condition!: Condition;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
