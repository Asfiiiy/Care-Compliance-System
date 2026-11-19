import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AuditService } from './audit.service';

import { CreateAuditDto } from './dto/create-audit.dto';
import { AuditQueryDto } from './dto/audit-query.dto';

import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth('JWT')
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create audit log',
  })
  create(
    @Body() dto: CreateAuditDto,
  ) {
    return this.auditService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get audit logs',
  })
  findAll(
    @Query() query: AuditQueryDto,
  ) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get audit log by id',
  })
  findOne(
    @Param('id') id: string,
  ) {
    return this.auditService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete audit log',
  })
  remove(
    @Param('id') id: string,
  ) {
    return this.auditService.remove(id);
  }
}