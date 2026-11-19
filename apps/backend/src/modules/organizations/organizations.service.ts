import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificateStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateComplianceAndRating(org: any) {
    const staff = org.staff || [];
    let totalItems = 0;
    let validItems = 0;
    const now = new Date();

    for (const s of staff) {
      totalItems += (s.certificates?.length || 0) + (s.trainings?.length || 0) + (s.competencies?.length || 0);

      const validCerts = (s.certificates || []).filter(
        (c: any) => (!c.expiryDate || c.expiryDate > now) && c.status !== CertificateStatus.EXPIRED,
      ).length;

      const validTrainings = (s.trainings || []).filter(
        (t: any) => !t.expiresOn || t.expiresOn > now,
      ).length;

      const passedComps = (s.competencies || []).filter((c: any) => c.level === 'PASS').length;

      validItems += validCerts + validTrainings + passedComps;
    }

    const complianceScore = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

    let predictedRating = 'Good';
    if (complianceScore >= 90) predictedRating = 'Outstanding';
    else if (complianceScore >= 75) predictedRating = 'Good';
    else if (complianceScore >= 55) predictedRating = 'Requires Improvement';
    else predictedRating = 'Inadequate';

    // Remove staff relations from the payload to keep response size optimal
    const { staff: _, ...orgData } = org;

    return {
      ...orgData,
      complianceScore,
      rating: predictedRating,
    };
  }

  async create(dto: CreateOrganizationDto) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        address: dto.address || null,
        postcode: dto.postcode || null,
        registrationNumber: dto.registrationNumber || null,
        phone: dto.phone || null,
        email: dto.email || null,
        rating: dto.rating || 'Good',
        bedCapacity: dto.bedCapacity || 0,
        subscriptionPlan: dto.subscriptionPlan || 'Standard',
        subscriptionStatus: dto.subscriptionStatus || 'ACTIVE',
        status: dto.status || 'ACTIVE',
      },
    });
    return this.findOne(org.id);
  }

  async findAll(query?: { search?: string }) {
    const search = query?.search;
    const orgs = await this.prisma.organization.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { postcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: {
            users: true,
            staff: true,
          },
        },
        staff: {
          include: {
            certificates: true,
            trainings: true,
            competencies: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return orgs.map((org) => this.calculateComplianceAndRating(org));
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            staff: true,
          },
        },
        staff: {
          include: {
            certificates: true,
            trainings: true,
            competencies: true,
          },
        },
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    return this.calculateComplianceAndRating(org);
  }

  async getWorkspaceDetails(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            staff: true,
          },
        },
        staff: {
          include: {
            user: true,
            certificates: true,
            trainings: true,
            competencies: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    const now = new Date();
    const managers = org.users.filter((u) => u.role === UserRole.MANAGER);
    const staffMembers = org.staff.filter((s) => s.user.role === UserRole.STAFF);

    // Calculate compliance metrics for staff
    let totalItems = 0;
    let validItems = 0;
    const staffList = staffMembers.map((s) => {
      const sCerts = s.certificates || [];
      const sTrainings = s.trainings || [];
      const sCompetencies = s.competencies || [];

      const totalSItems = sCerts.length + sTrainings.length + sCompetencies.length;

      const validCerts = sCerts.filter(
        (c) => (!c.expiryDate || c.expiryDate > now) && c.status !== CertificateStatus.EXPIRED,
      ).length;

      const validTrainings = sTrainings.filter(
        (t) => !t.expiresOn || t.expiresOn > now,
      ).length;

      const passedComps = sCompetencies.filter((c) => c.level === 'PASS').length;

      const validSItems = validCerts + validTrainings + passedComps;
      const sComplianceScore = totalSItems > 0 ? Math.round((validSItems / totalSItems) * 100) : 0;

      totalItems += totalSItems;
      validItems += validSItems;

      const managerName = managers.length > 0 
        ? managers.map(m => `${m.staff?.firstName || ''} ${m.staff?.lastName || ''}`.trim()).filter(Boolean).join(', ') 
        : 'No Manager';

      return {
        id: s.id,
        employeeNo: s.employeeNo,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        address: s.address,
        avatarUrl: s.avatarUrl,
        hireDate: s.hireDate,
        dateOfBirth: s.dateOfBirth,
        emergencyContact: s.emergencyContact,
        userId: s.userId,
        status: s.user.status,
        complianceScore: sComplianceScore,
        trainingProgress: `${validTrainings}/${sTrainings.length}`,
        competencyStatus: `${passedComps}/${sCompetencies.length} Passed`,
        managerName,
        certificates: sCerts,
        trainings: sTrainings,
        competencies: sCompetencies,
        createdAt: s.createdAt,
      };
    });

    const complianceScore = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

    let predictedRating = 'Good';
    if (complianceScore >= 90) predictedRating = 'Outstanding';
    else if (complianceScore >= 75) predictedRating = 'Good';
    else if (complianceScore >= 55) predictedRating = 'Requires Improvement';
    else predictedRating = 'Inadequate';

    // Calculate manager pending tasks
    const expiredCertsCount = org.staff.reduce((acc, s) => {
      return acc + s.certificates.filter(c => c.status === CertificateStatus.EXPIRED).length;
    }, 0);
    const expiringCertsCount = org.staff.reduce((acc, s) => {
      return acc + s.certificates.filter(c => c.status === CertificateStatus.EXPIRING).length;
    }, 0);
    const failedCompsCount = org.staff.reduce((acc, s) => {
      return acc + s.competencies.filter(c => c.level === 'FAIL').length;
    }, 0);
    const expiredTrainingsCount = org.staff.reduce((acc, s) => {
      return acc + s.trainings.filter(t => t.expiresOn && t.expiresOn < now).length;
    }, 0);
    const totalPendingTasks = expiredCertsCount + expiringCertsCount + failedCompsCount + expiredTrainingsCount;

    const managerList = managers.map((m) => {
      return {
        id: m.id,
        email: m.email,
        status: m.status,
        createdAt: m.createdAt,
        firstName: m.staff?.firstName || '',
        lastName: m.staff?.lastName || '',
        phone: m.staff?.phone || '',
        assignedStaffCount: staffMembers.length,
        complianceScore,
        pendingTasks: totalPendingTasks,
      };
    });

    // Generate Reports Breakdown
    const expiringCertificatesList = org.staff.flatMap(s => 
      s.certificates
        .filter(c => c.status === CertificateStatus.EXPIRING || (c.expiryDate && c.expiryDate > now && c.expiryDate < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)))
        .map(c => ({
          id: c.id,
          title: c.title,
          issuer: c.issuer,
          expiryDate: c.expiryDate,
          staffName: `${s.firstName} ${s.lastName}`,
          employeeNo: s.employeeNo,
        }))
    );

    const overdueTrainingsList = org.staff.flatMap(s => 
      s.trainings
        .filter(t => t.expiresOn && t.expiresOn < now)
        .map(t => ({
          id: t.id,
          title: t.title,
          provider: t.provider,
          expiresOn: t.expiresOn,
          staffName: `${s.firstName} ${s.lastName}`,
          employeeNo: s.employeeNo,
        }))
    );

    const failedCompetenciesList = org.staff.flatMap(s => 
      s.competencies
        .filter(c => c.level === 'FAIL')
        .map(c => ({
          id: c.id,
          name: c.name,
          signature: c.signature,
          achievedOn: c.achievedOn,
          assessorNotes: c.assessorNotes,
          staffName: `${s.firstName} ${s.lastName}`,
          employeeNo: s.employeeNo,
        }))
    );

    // Notifications scoped to this organization's users
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: { in: org.users.map(u => u.id) }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Audit logs scoped to this organization's users
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        userId: { in: org.users.map(u => u.id) }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      overview: {
        id: org.id,
        name: org.name,
        address: org.address,
        postcode: org.postcode,
        rating: predictedRating,
        registrationNumber: org.registrationNumber || 'CQC-PENDING',
        status: org.status || 'ACTIVE',
        phone: org.phone || 'N/A',
        email: org.email || 'N/A',
        bedCapacity: org.bedCapacity || 0,
        subscriptionPlan: org.subscriptionPlan || 'Standard',
        subscriptionStatus: org.subscriptionStatus || 'ACTIVE',
        subscriptionExpiry: org.subscriptionExpiry,
        createdAt: org.createdAt,
        complianceScore,
        totalManagers: managers.length,
        totalStaff: staffMembers.length,
        activeUsers: org.users.filter(u => u.status === 'ACTIVE').length,
        inactiveUsers: org.users.filter(u => u.status === 'INACTIVE').length,
        certificatesCount: org.staff.reduce((acc, s) => acc + s.certificates.length, 0),
        competenciesCount: org.staff.reduce((acc, s) => acc + s.competencies.length, 0),
        trainingsCount: org.staff.reduce((acc, s) => acc + s.trainings.length, 0),
        reportsCount: auditLogs.length,
        notificationsCount: notifications.filter(n => n.status === 'UNREAD').length,
      },
      managers: managerList,
      staff: staffList,
      reports: {
        expiringCertificates: expiringCertificatesList,
        overdueTraining: overdueTrainingsList,
        failedCompetencies: failedCompetenciesList,
        activeStaffCount: staffMembers.filter(s => s.user.status === 'ACTIVE').length,
        inactiveStaffCount: staffMembers.filter(s => s.user.status === 'INACTIVE').length,
        complianceTrends: [
          { name: 'Safeguarding', score: 85 },
          { name: 'Hoist Safety', score: 75 },
          { name: 'IPC', score: 90 },
          { name: 'Medication', score: 95 },
        ],
      },
      notifications,
      auditLogs,
    };
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id); // Throws if not found
    await this.prisma.organization.update({
      where: { id },
      data: dto,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id); // Throws if not found
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async getPublicList() {
    return this.prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        address: true,
        postcode: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
