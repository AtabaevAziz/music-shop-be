import { IsString, IsUrl, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  country!: string;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true
  })
  website!: string;

  @IsString()
  @MinLength(1)
  status!: string;
}

