import { IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class CreateClientRepairDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsString()
  @MinLength(2)
  instrumentName!: string;

  @IsString()
  @MinLength(2)
  brand!: string;

  @IsString()
  @MinLength(8)
  issue!: string;

  @IsString()
  @MinLength(4)
  notes!: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
