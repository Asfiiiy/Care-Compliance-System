import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create notification' })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: any,
  ) {
    // If manager, check if target user is in the same organization
    if (user.role === UserRole.MANAGER) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: createNotificationDto.userId },
      });
      if (!targetUser || targetUser.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You can only create notifications for users in your organization',
        );
      }
    }
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'List notifications (scoped)' })
  findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.findAll(query, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get notification by id' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (user.role === UserRole.STAFF && notification.userId !== user.sub) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.MANAGER && notification.user.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    return notification;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update notification' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (user.role === UserRole.STAFF && notification.userId !== user.sub) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.MANAGER && notification.user.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete notification' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}