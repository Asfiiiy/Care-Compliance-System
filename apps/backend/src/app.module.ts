import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Config & Database
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';

// Core Modules
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

// Feature Modules
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { StaffModule } from './modules/staff/staff.module';
import { TrainingModule } from './modules/training/training.module';
import { CompetenciesModule } from './modules/competencies/competencies.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MailModule } from './modules/mail/mail.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    AppConfigModule,

    PrismaModule,

    // Enable Cron Jobs
    ScheduleModule.forRoot(),

    // Rate Limiter
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 100,
        },
      ],
    }),

    // Core Modules
    HealthModule,
    AuthModule,

    // Feature Modules
    UsersModule,
    OrganizationsModule,
    StaffModule,
    TrainingModule,
    CompetenciesModule,
    CertificatesModule,
    NotificationsModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
    SchedulerModule,
    UploadsModule,
    MailModule,
    CopilotModule,
    MessagesModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}