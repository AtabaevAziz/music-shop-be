import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from 'class-validator';
import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
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

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @IsOptional()
  @IsString()
  deliveryCompany?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items!: ClientOrderItemDto[];
}
