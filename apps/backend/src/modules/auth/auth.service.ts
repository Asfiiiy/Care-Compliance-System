import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';

import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async getInvitationInfo(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        invitationToken: token,
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid activation token.');
    }

    if (user.invitationTokenExpires && new Date() > user.invitationTokenExpires) {
      throw new BadRequestException('Invitation has expired. Please request a new activation link.');
    }

    return {
      email: user.email,
      organizationName: user.organization?.name || 'CareCompliance',
    };
  }

  async activateAccount(dto: ActivateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        invitationToken: dto.token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid activation token.');
    }

    if (user.invitationTokenExpires && new Date() > user.invitationTokenExpires) {
      throw new BadRequestException('Invitation has expired.');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        invitationToken: null,
        invitationTokenExpires: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        action: 'USER_ACTIVATION',
        entity: 'User',
        entityId: user.id,
        description: `Account activated for ${user.email}`,
        userId: user.id,
      },
    });

    return {
      success: true,
      message: 'Your account has been successfully activated! Please log in.',
    };
  }

  async getPublicOrganizations() {
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

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    if (dto.accountType === 'STAFF') {
      if (!dto.organizationId) {
        throw new BadRequestException('Please select a Care Home / Organization to join');
      }

      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });

      if (!org || org.status !== 'ACTIVE') {
        throw new BadRequestException('Selected Care Home is invalid or inactive');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: 'STAFF',
            status: 'ACTIVE',
            organizationId: org.id,
          },
        });

        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const employeeNo = `EMP-STF-${randomSuffix}`;

        const staff = await tx.staff.create({
          data: {
            employeeNo,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone || undefined,
            address: dto.address || undefined,
            hireDate: new Date(),
            userId: user.id,
            organizationId: org.id,
          },
        });

        // Seed initial mandatory training modules
        const now = new Date();
        const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const mandatoryTrainings = [
          { title: 'Moving & Handling (Hoisting Safety)', provider: 'Care Skills Academy UK' },
          { title: 'Safeguarding Vulnerable Adults (Level 2)', provider: 'Skills for Care UK' },
          { title: 'Fire Safety & Evacuation Protocols', provider: 'National Health & Safety' },
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

        // Seed practical bedside competency
        await tx.competency.create({
          data: {
            name: 'Bedside Hoist Transfer Safety Checklist',
            level: 'PASS',
            achievedOn: now,
            expiresOn: inOneYear,
            staffId: staff.id,
            assessorNotes: 'Observed resident transfer safely adhering to LOLER regulations.',
          },
        });

        return user;
      });

      return this.generateAuthResponse(result as any);
    }

    // Default: MANAGER Registration
    if (!dto.organizationName) {
      throw new BadRequestException('Care home / organization name is required');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName!,
          rating: 'Good',
          status: 'ACTIVE',
          address: dto.address || undefined,
          postcode: dto.postcode || undefined,
          phone: dto.phone || undefined,
          email: email,
          bedCapacity: dto.bedCapacity || 35,
          subscriptionPlan: 'Enterprise',
          subscriptionStatus: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'MANAGER',
          status: 'ACTIVE',
          organizationId: organization.id,
        },
      });

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const employeeNo = `EMP-MGR-${randomSuffix}`;

      await tx.staff.create({
        data: {
          employeeNo,
          firstName: dto.firstName,
          lastName: dto.lastName,
          jobTitle: 'Registered Home Manager',
          department: 'Care Home Management',
          employmentType: 'Full-Time',
          phone: dto.phone || undefined,
          address: dto.address || undefined,
          hireDate: new Date(),
          userId: user.id,
          organizationId: organization.id,
        },
      });

      return user;
    });

    return this.generateAuthResponse(result as any);
  }

  async login(
    dto: LoginDto,
  ): Promise<AuthResponseDto> {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email.toLowerCase(),
        },
      });

    if (!user) {
      throw new ForbiddenException('Invalid email or password');
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      );
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!validPassword) {
      const attempts = user.failedLoginAttempts + 1;
      const data: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data,
      });
      throw new ForbiddenException('Invalid email or password');
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // Check User Status
    if (user.status === 'INVITED') {
      throw new ForbiddenException(
        'Your account has not been activated. Please check your invitation email to set your password.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Your account is inactive. Please contact your administrator.',
      );
    }

    // Check Organization active status
    if (user.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
      if (!org || org.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'Your care facility is inactive. All user access has been suspended.',
        );
      }
    }

    return this.generateAuthResponse(user);
  }

  async refresh(
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    let payload: JwtPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          refreshToken,
          {
            secret:
              this.config.getOrThrow<string>(
                'JWT_REFRESH_SECRET',
              ),
          },
        );
    } catch {
      throw new ForbiddenException(
        'Invalid refresh token',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Your account is inactive. Please contact your administrator.',
      );
    }

    if (user.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
      if (!org || org.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'Your care facility is inactive. All user access has been suspended.',
        );
      }
    }

    if (!user.refreshTokenHash) {
      throw new ForbiddenException(
        'Invalid refresh token',
      );
    }

    const valid = await argon2.verify(
      user.refreshTokenHash,
      refreshToken,
    );

    if (!valid) {
      throw new ForbiddenException(
        'Invalid refresh token',
      );
    }

    return this.generateAuthResponse(user);
  }

  async logout(
    userId: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });
  }

  async me(userId: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          organizationId: true,
          organization: true,
          createdAt: true,
          updatedAt: true,
          staff: {
            select: {
              id: true,
              employeeNo: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              phone: true,
              address: true,
              hireDate: true,
              dateOfBirth: true,
              emergencyContact: true,
            },
          },
        },
      });

    if (!user) {
      throw new ForbiddenException(
        'User not found',
      );
    }

    return user;
  }

  private async generateAuthResponse(
    user: User,
  ): Promise<AuthResponseDto> {
    const staff = await this.prisma.staff.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        employeeNo: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phone: true,
        address: true,
        hireDate: true,
        dateOfBirth: true,
        emergencyContact: true,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    const refreshToken =
      await this.jwtService.signAsync(
        payload,
        {
          secret:
            this.config.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),
          expiresIn:
            this.config.getOrThrow<string>(
              'JWT_REFRESH_EXPIRES',
            ) as any,
        },
      );

    const refreshTokenHash =
      await argon2.hash(refreshToken);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        staff: staff || undefined,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email address.');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Password reset is not allowed for Admin accounts.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Your account is not active.');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: otp,
        passwordResetOtpExpires: expiry,
      } as any,
    });

    try {
      await this.mailService.sendOtpEmail(user.email, otp);
    } catch (mailErr: any) {
      console.error(`[SMTP Warning] Failed to send OTP email to ${user.email} (SMTP server not configured or credentials invalid): ${mailErr.message}`);
    }

    // Always log the OTP to the console to allow local testing
    console.log(`\n==================================================`);
    console.log(`🔑 PASSWORD RESET OTP FOR ${user.email}: ${otp}`);
    console.log(`==================================================\n`);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'User',
        entityId: user.id,
        description: 'Password reset OTP requested',
        userId: user.id,
      },
    });

    return {
      success: true,
      message: 'OTP has been sent to your email address.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email address.');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Password reset is not allowed for Admin accounts.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Your account is not active.');
    }

    const u = user as any;
    if (!u.passwordResetOtp || !u.passwordResetOtpExpires) {
      throw new BadRequestException('No password reset has been requested.');
    }

    if (u.passwordResetOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP code.');
    }

    if (new Date() > u.passwordResetOtpExpires) {
      throw new BadRequestException('OTP code has expired.');
    }

    // Update password
    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetOtp: null,
        passwordResetOtpExpires: null,
        refreshTokenHash: null, // Revoke refresh tokens on password change
      } as any,
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'User',
        entityId: user.id,
        description: 'Password successfully reset via OTP',
        userId: user.id,
      },
    });

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  }
}