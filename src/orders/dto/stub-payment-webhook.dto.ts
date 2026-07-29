import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class StubPaymentWebhookDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
