import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength
} from 'class-validator';
import { Condition } from '../../common/enums/condition.enum';
import { ProductStatus } from '../../common/enums/product-status.enum';

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
  brandId!: string;

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
}

