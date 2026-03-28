import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tenantSlug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string;
}
