import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestAuditDto {
  @ApiProperty({
    description: 'Competency key or title to assess (e.g. hoist_safety, medication_admin)',
    example: 'hoist_safety',
  })
  @IsNotEmpty()
  @IsString()
  competency!: string;

  @ApiPropertyOptional({
    description: 'Preferred shift or observation window',
    example: 'Day Shift (08:00 - 16:00)',
  })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiPropertyOptional({
    description: 'Carer notes or context for the assessor',
    example: 'Completed e-learning hoist course, ready for practical sling fitting assessment.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
