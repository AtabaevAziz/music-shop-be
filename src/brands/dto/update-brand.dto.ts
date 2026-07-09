import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  country?: string;

  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true
  })
  website?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  status?: string;
}

