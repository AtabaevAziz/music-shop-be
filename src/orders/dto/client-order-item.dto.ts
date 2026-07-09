import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class ClientOrderItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitPrice!: number;
}

