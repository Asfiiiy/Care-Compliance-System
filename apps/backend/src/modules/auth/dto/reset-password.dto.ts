import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The registered email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'The 6-digit verification OTP' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp!: string;

  @ApiProperty({ description: 'The new password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}
