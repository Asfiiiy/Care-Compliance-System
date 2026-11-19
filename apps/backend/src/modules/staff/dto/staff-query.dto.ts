import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class QueryStaffDto {
  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  limit = 10;

  @ApiPropertyOptional({
    example: 'john',
  })
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
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;
}