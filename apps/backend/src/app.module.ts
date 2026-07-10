import { Module } from '@nestjs/common';

// Config & Database
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';

// Core Modules
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

// Feature Modules
import { UsersModule } from './modules/users/users.module';
import { StaffModule } from './modules/staff/staff.module';
import { TrainingModule } from './modules/training/training.module';
import { CompetenciesModule } from './modules/competencies/competencies.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Global Modules
    AppConfigModule,
    PrismaModule,

    // Core
    HealthModule,
    AuthModule,

    // Features
    UsersModule,
    StaffModule,
    TrainingModule,
    CompetenciesModule,
    CertificatesModule,
    NotificationsModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
  ],
})
export class AppModule {}