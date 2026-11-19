import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTrainingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsDateString()
  completedOn!: string;

  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  @IsString()
  @IsNotEmpty()
  staffId!: string;
}