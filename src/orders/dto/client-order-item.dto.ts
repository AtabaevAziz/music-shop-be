import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class ClientOrderItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((_, value) => value !== undefined)
  qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((_, value) => value !== undefined)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitPrice?: number;
}
