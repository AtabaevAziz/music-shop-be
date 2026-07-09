import { IsString, MinLength } from 'class-validator';

export class ProductImageDto {
  @IsString()
  @MinLength(1)
  image!: string;
}

