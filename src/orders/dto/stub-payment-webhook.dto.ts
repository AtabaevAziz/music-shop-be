import { IsEnum, IsString, MinLength } from "class-validator";
import { PaymentStatus } from "../../common/enums/payment-status.enum";

export class StubPaymentWebhookDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsString()
  @MinLength(1)
  transactionId!: string;
}
