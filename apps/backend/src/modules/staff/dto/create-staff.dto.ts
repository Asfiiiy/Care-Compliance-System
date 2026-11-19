import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({
    example: 'John',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: 'EMP001',
  })
  @IsString()
  employeeNo!: string;

  @ApiPropertyOptional({
    example: 'Senior Care Assistant',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'Residential Care',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    example: 'Full-Time',
  })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({
    example: '001589234812',
  })
  @IsOptional()
  @IsString()
  dbsNumber?: string;

  @ApiPropertyOptional({
    example: 'QQ 12 34 56 A',
  })
  @IsOptional()
  @IsString()
  nationalInsuranceNo?: string;

  @ApiPropertyOptional({
    example: '+44 123456789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'London, United Kingdom',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '1998-05-20',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'Jane Doe (Mother) - +44 987654321',
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({
    example: '2026-07-12',
  })
  @IsDateString()
  hireDate!: string;

  @ApiProperty({
    example: 'john@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'StrongPassword123',
    minLength: 8,
  })
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.STAFF,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRole = UserRole.STAFF;

  @ApiPropertyOptional({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.ACTIVE;

  @ApiPropertyOptional({
    example: 'cmrhc3lzs0001sktthz9n8ie5',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}