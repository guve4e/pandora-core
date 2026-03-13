import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
