import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}