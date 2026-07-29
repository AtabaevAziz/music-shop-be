import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class UpdateOrderPaymentDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  comment?: string;
}
