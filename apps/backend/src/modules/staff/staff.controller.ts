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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

import { StaffService } from './staff.service';
import { PrismaService } from '../../database/prisma.service';

import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/staff-query.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { multerOptions } from '../uploads/multer.config';

@ApiTags('Staff')
@ApiBearerAuth('JWT')
@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create new staff member',
  })
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      dto.organizationId = user.organizationId;
    }
    return this.staffService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all staff',
  })
  findAll(
    @Query() query: QueryStaffDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      query.organizationId = user.organizationId;
      query.role = UserRole.STAFF; // Managers should only see STAFF role users
    }
    return this.staffService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get staff by ID',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const staff = await this.staffService.findOne(id);
    if (user.role === UserRole.STAFF) {
      if (staff.userId !== user.sub) {
        throw new ForbiddenException('You do not have permission to view other staff profiles');
      }
    }
    if (user.role === UserRole.MANAGER && staff.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have permission to view staff in other organizations');
    }
    return staff;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Update staff details or upload avatar',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: any,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord || staffRecord.id !== id) {
        throw new ForbiddenException('You do not have permission to edit this profile');
      }
    }

    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id },
        include: { user: true },
      });
      if (
        !staffRecord ||
        staffRecord.organizationId !== user.organizationId ||
        staffRecord.user.role !== UserRole.STAFF
      ) {
        throw new ForbiddenException('You do not have permission to edit this account');
      }
    }

    if (avatar) {
      dto.avatarUrl = `/uploads/certificates/${avatar.filename}`; // Save path under certificates folder which stores static uploads
    }

    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Delete staff',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id },
        include: { user: true },
      });
      if (
        !staffRecord ||
        staffRecord.organizationId !== user.organizationId ||
        staffRecord.user.role !== UserRole.STAFF
      ) {
        throw new ForbiddenException('You do not have permission to deactivate this account');
      }
    }
    return this.staffService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Restore staff',
  })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id },
        include: { user: true },
      });
      if (
        !staffRecord ||
        staffRecord.organizationId !== user.organizationId ||
        staffRecord.user.role !== UserRole.STAFF
      ) {
        throw new ForbiddenException('You do not have permission to restore this account');
      }
    }
    return this.staffService.restore(id);
  }
}