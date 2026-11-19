import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto & { referenceId?: string; referenceType?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: createNotificationDto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    if (createNotificationDto.referenceId && createNotificationDto.referenceType) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: createNotificationDto.userId,
          referenceId: createNotificationDto.referenceId,
          referenceType: createNotificationDto.referenceType,
        },
      });

      if (existing) {
        // If it already exists, just update it to be unread and update message if needed
        return this.prisma.notification.update({
          where: { id: existing.id },
          data: {
            title: createNotificationDto.title,
            message: createNotificationDto.message,
            status: NotificationStatus.UNREAD,
            createdAt: new Date(), // touch the timestamp so it shows up at the top
          },
          include: {
            user: {
              select: { id: true, email: true, role: true, status: true },
            },
          },
        });
      }
    }

    return this.prisma.notification.create({
      data: {
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type:
          createNotificationDto.type ?? 'INFO',
        userId: createNotificationDto.userId,
        referenceId: createNotificationDto.referenceId,
        referenceType: createNotificationDto.referenceType,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
    },
    user: any,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search;

    const skip = (page - 1) * limit;

    // Apply role-based filtering: Staff users only see their own notifications, Managers see only their organization's notifications
    let roleFilter: Prisma.NotificationWhereInput = {};
    if (user.role === 'STAFF') {
      roleFilter = { userId: user.sub };
    } else if (user.role === 'MANAGER') {
      roleFilter = {
        user: {
          organizationId: user.organizationId,
        },
      };
    }

    const where: Prisma.NotificationWhereInput = {
      AND: [
        roleFilter,
        search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  message: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {},
      ],
    };

  const [notifications, total] =
    await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({
        where,
      }),
    ]);

  return {
    data: notifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {
    const notification =
      await this.prisma.notification.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    await this.findOne(id);

    const data: Prisma.NotificationUpdateInput =
      {};

    if (updateNotificationDto.title) {
      data.title =
        updateNotificationDto.title;
    }

    if (updateNotificationDto.message) {
      data.message =
        updateNotificationDto.message;
    }

    if (updateNotificationDto.type) {
      data.type =
        updateNotificationDto.type;
    }

    if (updateNotificationDto.userId) {
      const user =
        await this.prisma.user.findUnique({
          where: {
            id: updateNotificationDto.userId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'User not found',
        );
      }

      data.user = {
        connect: {
          id: updateNotificationDto.userId,
        },
      };
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async markAsRead(id: string) {
    await this.findOne(id);

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        status: NotificationStatus.READ,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.notification.delete({
      where: {
        id,
      },
    });
  }
}