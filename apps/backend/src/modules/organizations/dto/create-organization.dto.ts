import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization Name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Organization Address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Organization Postcode', required: false })
  @IsString()
  @IsOptional()
  postcode?: string;

  @ApiProperty({ description: 'Registration Number', required: false })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Bed Capacity', required: false })
  @IsNumber()
  @IsOptional()
  bedCapacity?: number;

  @ApiProperty({ description: 'CQC Rating', required: false })
  @IsString()
  @IsOptional()
  rating?: string;

  @ApiProperty({ description: 'Subscription Plan', required: false })
  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @ApiProperty({ description: 'Subscription Status', required: false })
  @IsString()
  @IsOptional()
  subscriptionStatus?: string;

  @ApiProperty({ description: 'Active Status', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
