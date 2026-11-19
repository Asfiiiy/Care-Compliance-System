import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAuditDto {
  @IsString()
  action!: string;

  @IsString()
  entity!: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}