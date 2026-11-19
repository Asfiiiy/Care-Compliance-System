import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateStatus,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CertificateScheduler {
  private readonly logger = new Logger(
    CertificateScheduler.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Development
  @Cron(CronExpression.EVERY_30_SECONDS)

  // Production
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateCertificateStatus() {
    this.logger.log(
      'Checking certificate expiry...',
    );

    const certificates =
      await this.prisma.certificate.findMany({
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });

    const today = new Date();

    for (const certificate of certificates) {
      if (!certificate.expiryDate) {
        continue;
      }
      const expiryDate = new Date(
        certificate.expiryDate,
      );

      const diffInDays = Math.ceil(
        (expiryDate.getTime() -
          today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let status: CertificateStatus;

      if (diffInDays < 0) {
        status = CertificateStatus.EXPIRED;
      } else if (diffInDays <= 30) {
        status = CertificateStatus.EXPIRING;
      } else {
        status = CertificateStatus.VALID;
      }

      // Update certificate status
      if (certificate.status !== status) {
        await this.prisma.certificate.update({
          where: {
            id: certificate.id,
          },
          data: {
            status,
          },
        });

        this.logger.log(
          `${certificate.title} → ${status}`,
        );
      }

      // Only create notifications for EXPIRING/EXPIRED
      if (
        status === CertificateStatus.EXPIRING ||
        status === CertificateStatus.EXPIRED
      ) {
        const title =
          status === CertificateStatus.EXPIRED
            ? 'Certificate Expired'
            : 'Certificate Expiring';

        const message =
          status === CertificateStatus.EXPIRED
            ? `${certificate.title} certificate for ${certificate.staff.firstName} ${certificate.staff.lastName} has expired.`
            : `${certificate.title} certificate for ${certificate.staff.firstName} ${certificate.staff.lastName} expires in ${diffInDays} day(s).`;

        // Use NotificationsService with referenceId to prevent duplicates
        await this.notificationsService.create({
          title,
          message,
          type:
            status === CertificateStatus.EXPIRED
              ? NotificationType.ERROR
              : NotificationType.WARNING,
          userId: certificate.staff.userId,
          referenceId: certificate.id,
          referenceType: 'CERTIFICATE',
        });

        this.logger.log(
          `Notification processed for ${certificate.staff.user.email} (Certificate: ${certificate.id})`,
        );
      }
    }

    this.logger.log(
      'Certificate status update completed.',
    );
  }
}