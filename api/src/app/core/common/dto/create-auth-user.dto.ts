import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../roles/user.roles';

export class CreateAuthUserDto {
  @IsString()
  @IsNotEmpty()
  tenant_slug!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
