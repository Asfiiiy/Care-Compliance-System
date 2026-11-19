import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompetencyQueryDto {
  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}