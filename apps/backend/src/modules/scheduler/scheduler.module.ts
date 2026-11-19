import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../../database/prisma.module';

import { CertificateScheduler } from './certificate.scheduler';
import { ExpiryScheduler } from './expiry.scheduler';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  providers: [
    CertificateScheduler,
    ExpiryScheduler,
  ],
})
export class SchedulerModule {}