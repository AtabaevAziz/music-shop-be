import { Type } from 'class-transformer';
import { IsInt, IsString, MinLength } from 'class-validator';

export class InventoryAdjustmentDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  delta!: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}

