import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'User ID of recipient' })
  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Type of message (TEXT, WARNING, SYSTEM)' })
  @IsString()
  @IsOptional()
  messageType?: string;

  @ApiPropertyOptional({ description: 'Related course title for compliance warnings' })
  @IsString()
  @IsOptional()
  courseTitle?: string;

  @ApiPropertyOptional({ description: 'Expiry date string' })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Status type (EXPIRED, EXPIRING)' })
  @IsString()
  @IsOptional()
  statusType?: string;
}
