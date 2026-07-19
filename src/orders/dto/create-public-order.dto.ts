import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from 'class-validator';
import { ClientOrderItemDto } from './client-order-item.dto';

export class CreatePublicOrderDto {
  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(4)
  address!: string;

  @IsString()
  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items!: ClientOrderItemDto[];
}
