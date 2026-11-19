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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CompetenciesService } from './competencies.service';

import { CreateCompetencyDto } from './dto/create-competency.dto';
import { UpdateCompetencyDto } from './dto/update-competency.dto';
import { CompetencyQueryDto } from './dto/competency-query.dto';
import { RequestAuditDto } from './dto/request-audit.dto';

import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Competencies')
@ApiBearerAuth('JWT')
@Controller('competencies')
export class CompetenciesController {
  constructor(
    private readonly competenciesService: CompetenciesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('request-audit')
  @Roles(UserRole.STAFF)
  @ApiOperation({ summary: 'Staff request for bedside audit observation' })
  async requestAudit(
    @Body() dto: RequestAuditDto,
    @CurrentUser() user: any,
  ) {
    return this.competenciesService.requestAudit(user.sub, dto);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create competency' })
  async create(
    @Body() dto: CreateCompetencyDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: dto.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You do not have permission to add competencies for staff in other organizations',
        );
      }
    }
    return this.competenciesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get competencies' })
  async findAll(
    @Query() query: CompetencyQueryDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord) {
        throw new NotFoundException('Associated staff profile not found');
      }
      query.staffId = staffRecord.id;
    }
    if (user.role === UserRole.MANAGER) {
      query.organizationId = user.organizationId;
    }
    return this.competenciesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get competency by id' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const competency = await this.competenciesService.findOne(id);
    if (user.role === UserRole.STAFF) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { userId: user.sub },
      });
      if (!staffRecord || competency.staffId !== staffRecord.id) {
        throw new ForbiddenException(
          'You do not have permission to view this competency',
        );
      }
    }
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: competency.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You do not have permission to view this competency',
        );
      }
    }
    return competency;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update competency' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompetencyDto,
    @CurrentUser() user: any,
  ) {
    const competency = await this.competenciesService.findOne(id);
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: competency.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You do not have permission to update competencies in other organizations',
        );
      }
    }
    return this.competenciesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete competency' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const competency = await this.competenciesService.findOne(id);
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: competency.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You do not have permission to delete competencies in other organizations',
        );
      }
    }
    return this.competenciesService.remove(id);
  }
}