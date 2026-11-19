import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The registered email address' })
  @IsEmail()
  email!: string;
}
