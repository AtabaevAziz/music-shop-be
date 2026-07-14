import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsEnum(Role)
  @IsIn([Role.Admin])
  role?: Role;

  @IsString()
  @MinLength(1)
  status!: string;
}
