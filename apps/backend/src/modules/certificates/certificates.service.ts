import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CertificateStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateQueryDto } from './dto/certificate-query.dto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private calculateStatus(
    expiryDate: Date,
  ): CertificateStatus {
    const today = new Date();

    if (expiryDate < today) {
      return CertificateStatus.EXPIRED;
    }

    const next30Days = new Date();
    next30Days.setDate(
      next30Days.getDate() + 30,
    );

    if (expiryDate <= next30Days) {
      return CertificateStatus.EXPIRING;
    }

    return CertificateStatus.VALID;
  }

  async create(
    dto: CreateCertificateDto,
    file?: Express.Multer.File,
  ) {
    const staff =
      await this.prisma.staff.findUnique({
        where: {
          id: dto.staffId,
        },
      });

    if (!staff) {
      throw new NotFoundException(
        'Staff not found',
      );
    }

    const expiryDate = dto.expiryDate
      ? new Date(dto.expiryDate)
      : null;

    const status = expiryDate
      ? this.calculateStatus(expiryDate)
      : CertificateStatus.VALID;

    const fileUrl = file
      ? `/uploads/certificates/${file.filename}`
      : dto.fileUrl ?? null;

    const certificate = await this.prisma.certificate.create({
      data: {
        title: dto.title,
        issuer: dto.issuer,
        issueDate: new Date(dto.issueDate),
        expiryDate,
        status,
        certificateNo:
          dto.certificateNo ?? null,
        fileUrl,
        staffId: dto.staffId!,
      },
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    // Synchronize certificate with Training matrix so e-learning counters update immediately
    try {
      const existingTraining = await this.prisma.training.findFirst({
        where: {
          staffId: dto.staffId!,
          title: {
            equals: dto.title,
            mode: 'insensitive',
          },
        },
      });

      if (existingTraining) {
        await this.prisma.training.update({
          where: { id: existingTraining.id },
          data: {
            completedOn: new Date(dto.issueDate),
            expiresOn: expiryDate,
            provider: dto.issuer,
          },
        });
      } else {
        await this.prisma.training.create({
          data: {
            title: dto.title,
            provider: dto.issuer,
            completedOn: new Date(dto.issueDate),
            expiresOn: expiryDate,
            staffId: dto.staffId!,
          },
        });
      }
    } catch (syncErr) {
      // Continue even if sync training fails
    }

    return certificate;
  }

  async findAll(
    query: CertificateQueryDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = query as any;

    const skip = (page - 1) * limit;

    const where: Prisma.CertificateWhereInput = {
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                issuer: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                certificateNo: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                staff: {
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
                  ],
                },
              },
            ],
          }
        : {}),
      ...(query.staffId ? { staffId: query.staffId } : {}),
      ...(query.organizationId ? { staff: { organizationId: query.organizationId } } : {}),
    };

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.certificate.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: order,
          },
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
        }),

        this.prisma.certificate.count({
          where,
        }),
      ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  async findOne(id: string) {
    const certificate =
      await this.prisma.certificate.findUnique({
        where: {
          id,
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!certificate) {
      throw new NotFoundException(
        'Certificate not found',
      );
    }

    return certificate;
  }

  async update(
    id: string,
    dto: UpdateCertificateDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id);

    const data: Prisma.CertificateUpdateInput =
      {};

    if (dto.title)
      data.title = dto.title;

    if (dto.issuer)
      data.issuer = dto.issuer;

    if (dto.issueDate) {
      data.issueDate = new Date(
        dto.issueDate,
      );
    }

    if (dto.expiryDate !== undefined) {
      const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
      data.expiryDate = expiryDate;
      data.status = expiryDate ? this.calculateStatus(expiryDate) : CertificateStatus.VALID;
    }

    if (
      dto.certificateNo !== undefined
    ) {
      data.certificateNo =
        dto.certificateNo;
    }

    if (file) {
      data.fileUrl = `/uploads/certificates/${file.filename}`;
    } else if (
      dto.fileUrl !== undefined
    ) {
      data.fileUrl = dto.fileUrl;
    }

    const updated = await this.prisma.certificate.update({
      where: {
        id,
      },
      data,
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    try {
      const existingTraining = await this.prisma.training.findFirst({
        where: {
          staffId: updated.staffId,
          title: {
            equals: updated.title,
            mode: 'insensitive',
          },
        },
      });

      if (existingTraining) {
        await this.prisma.training.update({
          where: { id: existingTraining.id },
          data: {
            completedOn: updated.issueDate,
            expiresOn: updated.expiryDate,
            provider: updated.issuer,
          },
        });
      }
    } catch (syncErr) {
      // Ignore sync error
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.certificate.delete({
      where: {
        id,
      },
    });
  }
}