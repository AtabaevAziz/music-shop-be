import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, MinLength, ValidateNested } from 'class-validator';
import { ClientOrderItemDto } from './client-order-item.dto';

export class CreateClientOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items!: ClientOrderItemDto[];

  @IsString()
  @MinLength(4)
  notes!: string;
}

