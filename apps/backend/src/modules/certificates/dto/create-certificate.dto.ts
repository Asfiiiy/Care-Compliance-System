import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty({
    example: 'First Aid Certificate',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'Red Cross',
  })
  @IsString()
  issuer!: string;

  @ApiProperty({
    example: '2026-07-12',
  })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({
    example: '2027-07-12',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: 'CERT-2026-001',
  })
  @IsOptional()
  @IsString()
  certificateNo?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/certificates/certificate.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    example: 'cmrhc3lzs0001sktthz9n8ie5',
  })
  @IsOptional()
  @IsString()
  staffId?: string;
}