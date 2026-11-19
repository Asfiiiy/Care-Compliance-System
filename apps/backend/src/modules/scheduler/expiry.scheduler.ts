import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  NotificationStatus,
  NotificationType,
} from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExpiryScheduler {
  private readonly logger = new Logger(
    ExpiryScheduler.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Development
  @Cron(CronExpression.EVERY_30_SECONDS)

  // Production
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkTrainingExpiry() {
    this.logger.log(
      'Checking training expiry...',
    );

    const trainings =
      await this.prisma.training.findMany({
        where: {
          expiresOn: {
            not: null,
          },
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });

    const today = new Date();

    for (const training of trainings) {
      const expiryDate = new Date(
        training.expiresOn!,
      );

      const diffInDays = Math.ceil(
        (expiryDate.getTime() -
          today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffInDays > 30) {
        continue;
      }

      const expired = diffInDays < 0;

      const title = expired
        ? 'Training Expired'
        : 'Training Expiring';

      const message = expired
        ? `${training.title} training for ${training.staff.firstName} ${training.staff.lastName} has expired.`
        : `${training.title} training for ${training.staff.firstName} ${training.staff.lastName} expires in ${diffInDays} day(s).`;

      await this.notificationsService.create({
        title,
        message,
        type: expired
          ? NotificationType.ERROR
          : NotificationType.WARNING,
        userId: training.staff.userId,
        referenceId: training.id,
        referenceType: 'TRAINING',
      });

      this.logger.log(
        `Training notification processed for ${training.staff.user.email} (Training: ${training.id})`,
      );
    }

    this.logger.log(
      'Training expiry check completed.',
    );
  }
}