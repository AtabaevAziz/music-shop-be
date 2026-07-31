import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  carrier?: string;

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
  @IsInt()
  weightGrams?: number;

  @IsOptional()
  @IsInt()
  lengthCm?: number;

  @IsOptional()
  @IsInt()
  widthCm?: number;

  @IsOptional()
  @IsInt()
  heightCm?: number;

  @IsOptional()
  @IsString()
  serialNumbers?: string;

  @IsOptional()
  @IsString()
  warehouseIssueType?: string;

  @IsOptional()
  @IsString()
  packagingComment?: string;
}
