import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';

import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/staff-query.dto';


@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private readonly userSelect = {
    id: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(dto: CreateStaffDto) {
    const email = dto.email.toLowerCase().trim();

    const existingEmail =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingEmail) {
      throw new BadRequestException(
        'Email already exists',
      );
    }

    const existingEmployee =
      await this.prisma.staff.findUnique({
        where: {
          employeeNo: dto.employeeNo,
        },
      });

    if (existingEmployee) {
      throw new BadRequestException(
        'Employee number already exists',
      );
    }

    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const plainPassword = dto.password || crypto.randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await argon2.hash(plainPassword);

    // Fetch organization name if facility ID exists
    let organizationName = '';
    if (dto.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (org) {
        organizationName = org.name;
      }
    }

    // Send credentials email
    try {
      await this.mailService.sendCredentialsEmail(
        email,
        `${dto.firstName} ${dto.lastName}`,
        dto.role ?? UserRole.STAFF,
        plainPassword,
        organizationName,
      );
    } catch (mailErr: any) {
      console.error(`[SMTP Warning] Failed to send credentials email to ${email}: ${mailErr.message}`);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: dto.role ?? UserRole.STAFF,
            status: dto.status || UserStatus.ACTIVE,
            organizationId: dto.organizationId,
            invitationToken,
            invitationTokenExpires,
          },
        });

        const staff = await tx.staff.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            employeeNo: dto.employeeNo,
            jobTitle: dto.jobTitle || 'Care Assistant',
            department: dto.department || 'Residential Care',
            employmentType: dto.employmentType || 'Full-Time',
            dbsNumber: dto.dbsNumber,
            nationalInsuranceNo: dto.nationalInsuranceNo,
            phone: dto.phone,
            address: dto.address,
            hireDate: new Date(dto.hireDate),
            dateOfBirth: dto.dateOfBirth
              ? new Date(dto.dateOfBirth)
              : null,
            emergencyContact: dto.emergencyContact,
            userId: user.id,
            organizationId: dto.organizationId,
          },
          include: {
            user: {
              select: this.userSelect,
            },
            organization: true,
            trainings: true,
            competencies: true,
            certificates: true,
          },
        });

        // Seed initial CQC mandatory training modules for newly onboarded staff
        const now = new Date();
        const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const mandatoryTrainings = [
          { title: 'Moving & Handling (Hoisting Safety)', provider: 'Care Skills Academy UK' },
          { title: 'Safeguarding Vulnerable Adults (Level 2/3)', provider: 'Skills for Care UK' },
          { title: 'Fire Safety & Emergency Evacuation', provider: 'National Health & Safety' },
          { title: 'Infection Prevention & Control (IPC)', provider: 'NHS England CPD' },
          { title: 'Safe Administration of Medication', provider: 'Care Compliance CPD' },
        ];

        for (const t of mandatoryTrainings) {
          await tx.training.create({
            data: {
              title: t.title,
              provider: t.provider,
              completedOn: now,
              expiresOn: inOneYear,
              staffId: staff.id,
            },
          });
        }

        // Seed initial practical competency
        await tx.competency.create({
          data: {
            name: 'Bedside Hoist & Transfer Safety Audit',
            level: 'PASS',
            achievedOn: now,
            expiresOn: inOneYear,
            staffId: staff.id,
            assessorNotes: 'Demonstrated complete adherence to hoist sling positioning and service user dignity protocols.',
            checklist: [
              { item: 'Pre-use equipment inspection completed', passed: true },
              { item: 'Correct sling size selected for user build', passed: true },
              { item: 'Service user verbal consent verified', passed: true },
              { item: 'Smooth transfer without incident', passed: true },
            ],
          },
        });

        return tx.staff.findUnique({
          where: { id: staff.id },
          include: {
            user: {
              select: this.userSelect,
            },
            organization: true,
            trainings: true,
            competencies: true,
            certificates: true,
          },
        });
      },
    );
  }

  async findAll(query: QueryStaffDto) {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.StaffWhereInput = {
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.status ? { user: { status: query.status as any } } : {}),
    ...(query.role
      ? { user: { role: query.role as any } }
      : { user: { role: { not: UserRole.ADMIN } } }),
    ...(search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              employeeNo: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              jobTitle: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              department: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              user: {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      : {}),
  };

  const [staff, total] = await this.prisma.$transaction([
    this.prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        user: {
          select: this.userSelect,
        },
        organization: {
          include: {
            _count: {
              select: {
                staff: true,
                users: true,
              },
            },
            staff: {
              select: {
                id: true,
                user: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        trainings: true,
        competencies: true,
        certificates: true,
      },
    }),

    this.prisma.staff.count({
      where,
    }),
  ]);

  return {
    data: staff,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {
    const staff =
      await this.prisma.staff.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: this.userSelect,
          },
          organization: {
            include: {
              _count: {
                select: {
                  staff: true,
                  users: true,
                },
              },
              staff: {
                select: {
                  id: true,
                  employeeNo: true,
                  firstName: true,
                  lastName: true,
                  jobTitle: true,
                  department: true,
                  avatarUrl: true,
                  phone: true,
                  user: {
                    select: {
                      role: true,
                      status: true,
                      email: true,
                    },
                  },
                },
                take: 20,
              },
            },
          },
          trainings: {
            orderBy: { completedOn: 'desc' },
          },
          competencies: {
            orderBy: { achievedOn: 'desc' },
          },
          certificates: {
            orderBy: { issueDate: 'desc' },
          },
        },
      });

    if (!staff) {
      throw new NotFoundException(
        'Staff not found',
      );
    }

    return staff;
  }

  async update(
    id: string,
    dto: UpdateStaffDto,
  ) {
    const staff = await this.findOne(id);

    if (dto.employeeNo) {
      const existing =
        await this.prisma.staff.findFirst({
          where: {
            employeeNo: dto.employeeNo,
            NOT: {
              id,
            },
          },
        });

      if (existing) {
        throw new BadRequestException(
          'Employee number already exists',
        );
      }
    }

    if (dto.role || dto.status) {
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: {
          ...(dto.role ? { role: dto.role } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.status === UserStatus.INACTIVE ? { refreshTokenHash: null } : {}),
        },
      });
    }

    return this.prisma.staff.update({
      where: {
        id,
      },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        employeeNo: dto.employeeNo,
        jobTitle: dto.jobTitle,
        department: dto.department,
        employmentType: dto.employmentType,
        dbsNumber: dto.dbsNumber,
        nationalInsuranceNo: dto.nationalInsuranceNo,
        phone: dto.phone,
        address: dto.address,
        avatarUrl: dto.avatarUrl,
        emergencyContact: dto.emergencyContact,
        hireDate: dto.hireDate
          ? new Date(dto.hireDate)
          : undefined,
        dateOfBirth: dto.dateOfBirth
          ? new Date(dto.dateOfBirth)
          : undefined,
      },
      include: {
        user: {
          select: this.userSelect,
        },
        organization: true,
        trainings: true,
        competencies: true,
        certificates: true,
      },
    });
  }

  async remove(id: string) {
    const staff = await this.findOne(id);

    await this.prisma.user.update({
      where: {
        id: staff.userId,
      },
      data: {
        status: UserStatus.INACTIVE,
        refreshTokenHash: null,
      },
    });

    return {
      message: 'Staff deactivated successfully',
    };
  }

  async restore(id: string) {
    const staff = await this.findOne(id);

    await this.prisma.user.update({
      where: {
        id: staff.userId,
      },
      data: {
        status: UserStatus.ACTIVE,
      },
    });

    return {
      message: 'Staff restored successfully',
    };
  }
}