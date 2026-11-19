import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateAuditDto } from './dto/create-audit.dto';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateAuditDto,
  ) {
    const data: Prisma.AuditLogCreateInput = {
      action: dto.action,
      entity: dto.entity,
      entityId: dto.entityId,
      description: dto.description,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      ...(dto.userId && {
        user: {
          connect: {
            id: dto.userId,
          },
        },
      }),
    };

    return this.prisma.auditLog.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(
    query: AuditQueryDto,
  ) {
    const {
      page = 1,
      limit = 10,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput =
      search
        ? {
            OR: [
              {
                action: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                entity: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {};

    const [logs, total] =
      await this.prisma.$transaction([
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.auditLog.count({
          where,
        }),
      ]);

    return {
      data: logs,
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

  async findOne(
    id: string,
  ) {
    const log =
      await this.prisma.auditLog.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

    if (!log) {
      throw new NotFoundException(
        'Audit log not found',
      );
    }

    return log;
  }

  async remove(
    id: string,
  ) {
    await this.findOne(id);

    return this.prisma.auditLog.delete({
      where: {
        id,
      },
    });
  }
}