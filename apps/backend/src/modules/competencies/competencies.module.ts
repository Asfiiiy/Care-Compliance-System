import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { CompetenciesController } from './competencies.controller';
import { CompetenciesService } from './competencies.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    CompetenciesController,
  ],
  providers: [CompetenciesService],
})
export class CompetenciesModule {}