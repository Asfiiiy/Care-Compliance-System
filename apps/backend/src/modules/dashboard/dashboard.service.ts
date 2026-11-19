import { Injectable } from '@nestjs/common';
import {
  CertificateStatus,
  NotificationStatus,
  UserRole,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /** Admin: global system summary */
  async getAdminSummary() {
    const [
      totalOrganizations,
      totalManagers,
      activeManagers,
      inactiveManagers,
      totalStaff,
      activeStaff,
      inactiveStaff,
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalCertificates,
      totalCompetencies,
      totalTrainings,
      expiredCertificates,
      expiringCertificates,
      failedCompetencies,
      unreadNotifications,
    ] = await this.prisma.$transaction([
      this.prisma.organization.count(),
      this.prisma.user.count({ where: { role: UserRole.MANAGER } }),
      this.prisma.user.count({ where: { role: UserRole.MANAGER, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: UserRole.MANAGER, status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { role: UserRole.STAFF } }),
      this.prisma.user.count({ where: { role: UserRole.STAFF, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { role: UserRole.STAFF, status: 'INACTIVE' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } }),
      this.prisma.certificate.count({ where: { staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.competency.count({ where: { staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.training.count({ where: { staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.certificate.count({ where: { status: CertificateStatus.EXPIRED, staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.certificate.count({ where: { status: CertificateStatus.EXPIRING, staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.competency.count({ where: { level: 'FAIL', staff: { user: { status: 'ACTIVE' } } } }),
      this.prisma.notification.count({ where: { status: NotificationStatus.UNREAD } }),
    ]);

    return {
      totalOrganizations,
      totalManagers,
      activeManagers,
      inactiveManagers,
      totalStaff,
      activeStaff,
      inactiveStaff,
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalCertificates,
      totalCompetencies,
      totalTrainings,
      expiredCertificates,
      expiringCertificates,
      failedCompetencies,
      unreadNotifications,
    };
  }

  /** Admin: top performing organizations */
  async getTopOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      include: {
        staff: {
          where: {
            user: {
              role: UserRole.STAFF,
            },
          },
          include: {
            certificates: true,
            trainings: true,
            competencies: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return orgs.map((org) => {
      const totalItems = org.staff.reduce((sum, s) => {
        return sum + s.certificates.length + s.trainings.length + s.competencies.length;
      }, 0);

      const now = new Date();
      const validItems = org.staff.reduce((sum, s) => {
        const validCerts = s.certificates.filter(
          (c) => (!c.expiryDate || c.expiryDate > now) && c.status !== CertificateStatus.EXPIRED,
        ).length;
        const validTrainings = s.trainings.filter(
          (t) => !t.expiresOn || t.expiresOn > now,
        ).length;
        const passedComps = s.competencies.filter((c) => c.level === 'PASS').length;
        return sum + validCerts + validTrainings + passedComps;
      }, 0);

      const complianceScore =
        totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

      return {
        id: org.id,
        name: org.name,
        rating: org.rating,
        staffCount: org.staff.length,
        complianceScore,
      };
    });
  }

  /** Admin: recent platform activity (newest certificates + trainings) */
  async getRecentActivity() {
    const recentCerts = await this.prisma.certificate.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: { firstName: true, lastName: true, organizationId: true },
        },
      },
    });
    const recentTrainings = await this.prisma.training.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: { firstName: true, lastName: true, organizationId: true },
        },
      },
    });
    return { recentCerts, recentTrainings };
  }

  /** Manager / shared: summary scoped by organization */
  async getSummary(organizationId?: string, includeInactive: boolean = false) {
    const allStaffWhere: Prisma.StaffWhereInput = {
      ...(organizationId ? { organizationId } : {}),
      user: {
        role: UserRole.STAFF,
      },
    };

    const activeStaffWhere: Prisma.StaffWhereInput = {
      ...(organizationId ? { organizationId } : {}),
      user: {
        role: UserRole.STAFF,
        status: 'ACTIVE',
      },
    };

    const activeStaffIds = (
      await this.prisma.staff.findMany({
        where: activeStaffWhere,
        select: { id: true },
      })
    ).map((s) => s.id);

    const allStaffIds = (
      await this.prisma.staff.findMany({
        where: allStaffWhere,
        select: { id: true },
      })
    ).map((s) => s.id);

    const targetStaffIds = includeInactive ? allStaffIds : activeStaffIds;

    const certWhere = { staffId: { in: targetStaffIds } };
    const trainingWhere = { staffId: { in: targetStaffIds } };
    const compWhere = { staffId: { in: targetStaffIds } };

    const [
      totalTrainings,
      totalCertificates,
      totalCompetencies,
      totalNotifications,
      unreadNotifications,
      expiredCertificates,
      expiringCertificates,
    ] = await this.prisma.$transaction([
      this.prisma.training.count({ where: trainingWhere }),
      this.prisma.certificate.count({ where: certWhere }),
      this.prisma.competency.count({ where: compWhere }),
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { status: NotificationStatus.UNREAD } }),
      this.prisma.certificate.count({
        where: { ...certWhere, status: CertificateStatus.EXPIRED },
      }),
      this.prisma.certificate.count({
        where: { ...certWhere, status: CertificateStatus.EXPIRING },
      }),
    ]);

    return {
      totalStaff: targetStaffIds.length,
      activeStaffCount: activeStaffIds.length,
      inactiveStaffCount: allStaffIds.length - activeStaffIds.length,
      totalStaffCount: allStaffIds.length,
      totalTrainings,
      totalCertificates,
      totalCompetencies,
      totalNotifications,
      unreadNotifications,
      expiredCertificates,
      expiringCertificates,
    };
  }

  async recentNotifications(organizationId?: string) {
    const where = organizationId
      ? {
          user: {
            organizationId,
          },
        }
      : {};

    return this.prisma.notification.findMany({
      take: 10,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async expiringCertificates(organizationId?: string) {
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const staffIds = (
      await this.prisma.staff.findMany({
        where: {
          ...(organizationId
            ? {
                OR: [
                  { organizationId },
                  { user: { organizationId } },
                ],
              }
            : {}),
          user: {
            role: UserRole.STAFF,
            status: 'ACTIVE',
          },
        },
        select: { id: true },
      })
    ).map((s) => s.id);

    return this.prisma.certificate.findMany({
      where: {
        OR: [
          { status: { in: [CertificateStatus.EXPIRING, CertificateStatus.EXPIRED] } },
          { expiryDate: { not: null, lte: next30Days } },
        ],
        staffId: { in: staffIds },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        staff: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });
  }

  async expiringTrainings(organizationId?: string) {
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const staffIds = (
      await this.prisma.staff.findMany({
        where: {
          ...(organizationId ? { organizationId } : {}),
          user: {
            role: UserRole.STAFF,
            status: 'ACTIVE',
          },
        },
        select: { id: true },
      })
    ).map((s) => s.id);

    return this.prisma.training.findMany({
      where: {
        expiresOn: { not: null, lte: next30Days },
        staffId: { in: staffIds },
      },
      orderBy: { expiresOn: 'asc' },
      include: {
        staff: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });
  }
}