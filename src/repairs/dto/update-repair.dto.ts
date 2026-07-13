import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { RepairStatus } from '../../common/enums/repair-status.enum';

export class UpdateRepairDto {
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

  @IsEnum(RepairStatus)
  status!: RepairStatus;

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
}
