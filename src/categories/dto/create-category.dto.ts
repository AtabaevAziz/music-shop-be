import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  parentId?: string | null;

  @IsString()
  @MinLength(1)
  status!: string;

  @IsString()
  @MinLength(4)
  description!: string;
}
