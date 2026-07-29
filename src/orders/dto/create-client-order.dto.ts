import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { DeliveryMethod } from '../../common/enums/delivery-method.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { ClientOrderItemDto } from './client-order-item.dto';

export class CreateClientOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClientOrderItemDto)
  items!: ClientOrderItemDto[];

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
  @MinLength(2)
  notes?: string;
}
