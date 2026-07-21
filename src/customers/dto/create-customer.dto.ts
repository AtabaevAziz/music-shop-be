import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomerTier } from '../../common/enums/customer-tier.enum';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsEnum(CustomerTier)
  tier!: CustomerTier;

  @IsString()
  @IsIn(['active', 'inactive'])
  status!: string;

  @IsString()
  @MinLength(1)
  notes!: string;
}
