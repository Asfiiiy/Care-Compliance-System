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
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { TrainingService } from './training.service';
import { PrismaService } from '../../database/prisma.service';

import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingQueryDto } from './dto/training-query.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Training')
@ApiBearerAuth('JWT')
@Controller('training')
export class TrainingController {
  constructor(
    private readonly trainingService: TrainingService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create training',
    description: 'Create a new training record for a staff member.',
  })
  async create(
    @Body() dto: CreateTrainingDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: dto.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to add training for staff in other organizations');
      }
    }
    return this.trainingService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all trainings',
    description: 'Returns paginated list of trainings with search and sorting support.',
  })
  findAll(
    @Query() query: TrainingQueryDto,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.MANAGER) {
      query.organizationId = user.organizationId;
    }
    return this.trainingService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get training by ID',
    description: 'Returns a single training record.',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const training = await this.trainingService.findOne(id);
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: training.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to view training in other organizations');
      }
    }
    return training;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update training',
    description: 'Update an existing training record.',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingDto,
    @CurrentUser() user: any,
  ) {
    const training = await this.trainingService.findOne(id);
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: training.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to update training in other organizations');
      }
    }
    return this.trainingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Delete training',
    description: 'Delete a training record.',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const training = await this.trainingService.findOne(id);
    if (user.role === UserRole.MANAGER) {
      const staffRecord = await this.prisma.staff.findUnique({
        where: { id: training.staffId },
      });
      if (!staffRecord || staffRecord.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have permission to delete training in other organizations');
      }
    }
    return this.trainingService.remove(id);
  }
}