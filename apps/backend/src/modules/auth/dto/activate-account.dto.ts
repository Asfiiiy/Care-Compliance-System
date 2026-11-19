import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({ description: 'The invitation activation token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'New password for the account', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
