import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompetencyDto {
  @IsString()
  name!: string;

  @IsString()
  level!: string;

  @IsDateString()
  achievedOn!: string;

  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  @IsString()
  staffId!: string;

  @IsOptional()
  @IsString()
  assessorNotes?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  checklist?: any;
}