import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateRepairDto {
  @IsString()
  customerId!: string;

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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  assignedMasterName?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
