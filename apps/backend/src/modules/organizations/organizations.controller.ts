import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('JWT')
@Controller('organizations')
@Roles(UserRole.ADMIN)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Public()
  @Get('public-list')
  @ApiOperation({ summary: 'Get active care homes list for staff registration' })
  getPublicList() {
    return this.organizationsService.getPublicList();
  }

  @Post()
  @ApiOperation({ summary: 'Create new organization (Admin only)' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  findAll(@Query('search') search?: string) {
    return this.organizationsService.findAll({ search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/workspace')
  @ApiOperation({ summary: 'Get complete organization workspace details (Admin only)' })
  getWorkspace(@Param('id') id: string) {
    return this.organizationsService.getWorkspaceDetails(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization details (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization (Admin only)' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
