import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomerTier } from '../../common/enums/customer-tier.enum';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(CustomerTier)
  tier?: CustomerTier;

  @IsOptional()
  @IsString()
  @MinLength(1)
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}

