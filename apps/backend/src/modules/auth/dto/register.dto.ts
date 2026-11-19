import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({
    enum: ['MANAGER', 'STAFF'],
    default: 'MANAGER',
    description: 'Account type: MANAGER for Care Home registration, STAFF for Carer registration',
  })
  @IsOptional()
  @IsEnum(['MANAGER', 'STAFF'])
  accountType?: 'MANAGER' | 'STAFF';

  @ApiPropertyOptional({
    example: 'Oakwood Care Home',
    description: 'Name of the Care Home (Required for MANAGER)',
  })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiPropertyOptional({
    example: 'cmtk...',
    description: 'Existing Care Home ID (Required for STAFF)',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    example: 'Sarah',
    description: 'First name',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: 'Jenkins',
    description: 'Last name',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: 'carer@carehome.com',
    description: 'Work email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Secure password with minimum 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Confirm password for client validation',
  })
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @ApiPropertyOptional({
    example: 'Senior Care Assistant',
    description: 'Job Title / Position (for Care Staff)',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    example: '07700900123',
    description: 'Direct contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '45 High Street, London',
    description: 'Address of the facility',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'SW1A 1AA',
    description: 'Postcode of the facility',
  })
  @IsOptional()
  @IsString()
  postcode?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Total bed capacity',
  })
  @IsOptional()
  @IsNumber()
  bedCapacity?: number;
}