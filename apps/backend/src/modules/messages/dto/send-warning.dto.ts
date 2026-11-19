import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendWarningDto {
  @ApiProperty({ description: 'Staff ID or User ID receiving the warning' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({ description: 'Title of the course or certification' })
  @IsString()
  @IsNotEmpty()
  courseTitle!: string;

  @ApiProperty({ description: 'Expiry date formatted string' })
  @IsString()
  @IsNotEmpty()
  expiryDate!: string;

  @ApiProperty({ description: 'Status: EXPIRED or EXPIRING' })
  @IsString()
  @IsNotEmpty()
  statusType!: 'EXPIRED' | 'EXPIRING';

  @ApiPropertyOptional({ description: 'Custom note from manager' })
  @IsString()
  @IsOptional()
  customNote?: string;

  @ApiPropertyOptional({ description: 'Dispatch via email', default: true })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Dispatch via in-app notification', default: true })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;

  @ApiPropertyOptional({ description: 'Dispatch via direct chat message', default: true })
  @IsBoolean()
  @IsOptional()
  sendChat?: boolean;
}
