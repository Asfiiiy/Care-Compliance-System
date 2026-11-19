import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
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
        dto.email.toLowerCase().trim(),
        `${dto.firstName} ${dto.lastName}`,
        dto.role,
        plainPassword,
        organizationName,
      );
    } catch (mailErr: any) {
      console.error(`[SMTP Warning] Failed to send credentials email to ${dto.email}: ${mailErr.message}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          role: dto.role,
          status: dto.status || 'ACTIVE',
          organizationId: dto.organizationId || null,
          invitationToken,
          invitationTokenExpires,
        },
      });

      // Generate a unique employee number
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const employeeNo = `EMP-${dto.firstName.substring(0, 3).toUpperCase()}-${suffix}`;

      await tx.staff.create({
        data: {
          employeeNo,
          firstName: dto.firstName,
          lastName: dto.lastName,
          hireDate: new Date(),
          userId: user.id,
          organizationId: dto.organizationId || null,
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          organization: true,
          staff: true,
        },
      });
    });
  }

  async findAll(currentUser: any) {
    const where: any = {};
    if (currentUser.role === 'MANAGER') {
      where.organizationId = currentUser.organizationId;
    }

    return this.prisma.user.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNo: true,
          },
        },
      },
      orderBy: {
        email: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
    }

    const data: any = {};
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.organizationId !== undefined) {
      data.organizationId = dto.organizationId || null;
    }

    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data,
      });

      // Keep associated Staff profile in sync (name and organization)
      if (user.staff && (dto.firstName || dto.lastName || dto.organizationId !== undefined)) {
        await tx.staff.update({
          where: { id: user.staff.id },
          data: {
            ...(dto.firstName ? { firstName: dto.firstName } : {}),
            ...(dto.lastName ? { lastName: dto.lastName } : {}),
            ...(dto.organizationId !== undefined ? { organizationId: dto.organizationId || null } : {}),
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          organization: true,
          staff: true,
        },
      });
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Delete staff first if it exists
      if (user.staff) {
        // Cascade delete will handle notifications/trainings/etc.
        await tx.staff.delete({
          where: { id: user.staff.id },
        });
      }
      return tx.user.delete({
        where: { id },
      });
    });
  }

  async clearMockData(currentAdminId: string) {
    // Find current admin staff profile
    const adminStaff = await this.prisma.staff.findFirst({
      where: { userId: currentAdminId },
    });
    const adminStaffId = adminStaff?.id;

    return this.prisma.$transaction(async (tx) => {
      // 1. Purge general tables
      await tx.auditLog.deleteMany();
      await tx.notification.deleteMany();
      await tx.certificate.deleteMany();
      await tx.competency.deleteMany();
      await tx.training.deleteMany();

      // 2. Clear other staff records
      await tx.staff.deleteMany({
        where: adminStaffId
          ? {
              NOT: { id: adminStaffId },
            }
          : undefined,
      });

      // 3. Clear other users
      await tx.user.deleteMany({
        where: {
          NOT: { id: currentAdminId },
        },
      });

      // 4. Reset admin organization link
      await tx.user.update({
        where: { id: currentAdminId },
        data: { organizationId: null },
      });

      if (adminStaffId) {
        await tx.staff.update({
          where: { id: adminStaffId },
          data: { organizationId: null },
        });
      }

      // 5. Delete organizations
      await tx.organization.deleteMany();

      return {
        message: 'Mock data cleared successfully. Only active administrator remains.',
      };
    });
  }

  findAllOrganizations() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}