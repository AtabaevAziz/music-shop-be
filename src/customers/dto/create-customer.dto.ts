import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { CustomerTier } from '../../common/enums/customer-tier.enum';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsEnum(CustomerTier)
  tier!: CustomerTier;

  @IsString()
  @MinLength(1)
  status!: string;

  @IsString()
  @MinLength(1)
  notes!: string;
}

