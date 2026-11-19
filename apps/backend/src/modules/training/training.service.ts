import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingQueryDto } from './dto/training-query.dto';

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateTrainingDto) {
    const staff = await this.prisma.staff.findUnique({
      where: {
        id: dto.staffId,
      },
    });

    if (!staff) {
      throw new NotFoundException(
        'Staff not found',
      );
    }

    return this.prisma.training.create({
      data: {
        title: dto.title,
        provider: dto.provider,
        completedOn: new Date(dto.completedOn),
        expiresOn: dto.expiresOn
          ? new Date(dto.expiresOn)
          : null,
        staffId: dto.staffId,
      },
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(query: TrainingQueryDto) {
    const {
      page,
      limit,
      search,
      sortBy,
      order,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TrainingWhereInput = {
      ...(query.staffId ? { staffId: query.staffId } : {}),
      ...(query.organizationId ? { staff: { organizationId: query.organizationId } } : {}),
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
                provider: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                staff: {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                staff: {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.training.findMany({
          where,
          skip,
          take: limit,
          include: {
            staff: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            [sortBy]: order,
          },
        }),
        this.prisma.training.count({
          where,
        }),
      ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const training =
      await this.prisma.training.findUnique({
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

    if (!training) {
      throw new NotFoundException(
        'Training not found',
      );
    }

    return training;
  }

  async update(
    id: string,
    dto: UpdateTrainingDto,
  ) {
    await this.findOne(id);

    return this.prisma.training.update({
      where: {
        id,
      },
      data: {
        title: dto.title,
        provider: dto.provider,
        completedOn: dto.completedOn
          ? new Date(dto.completedOn)
          : undefined,
        expiresOn: dto.expiresOn
          ? new Date(dto.expiresOn)
          : undefined,
        staffId: dto.staffId,
      },
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.training.delete({
      where: {
        id,
      },
    });
  }
}