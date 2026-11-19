import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;
}