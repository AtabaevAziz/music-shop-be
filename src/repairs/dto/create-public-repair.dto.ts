import { IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreatePublicRepairDto {
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
  @MinLength(2)
  instrumentType!: string;

  @IsString()
  @MinLength(2)
  instrumentModel!: string;

  @IsString()
  @MinLength(8)
  issueDescription!: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
