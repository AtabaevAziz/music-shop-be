import { IsString, MinLength } from 'class-validator';

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
}

