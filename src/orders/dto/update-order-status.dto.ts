import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  deliveryCompany?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  trackingNumber?: string;

  @IsOptional()
  @IsBoolean()
  fragile?: boolean;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsOptional()
  @IsString()
  packagingComment?: string;
}
