import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { ReportsService } from './reports.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Staff report',
  })
  staffReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    const orgId = user.role === UserRole.ADMIN ? query.organizationId : user.organizationId;
    return this.reportsService.staffReport(query, orgId);
  }

  @Get('training')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Training report',
  })
  trainingReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    const orgId = user.role === UserRole.ADMIN ? query.organizationId : user.organizationId;
    return this.reportsService.trainingReport(query, orgId);
  }

  @Get('certificates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Certificate report',
  })
  certificateReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    const orgId = user.role === UserRole.ADMIN ? query.organizationId : user.organizationId;
    return this.reportsService.certificateReport(query, orgId);
  }

  @Get('compliance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Compliance report',
  })
  complianceReport(
    @CurrentUser() user: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const orgId = user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.reportsService.complianceReport(orgId, includeInactive === 'true');
  }

  @Get('expiring')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Expiring report',
  })
  expiringReport(
    @CurrentUser() user: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const orgId = user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.reportsService.expiringReport(orgId, includeInactive === 'true');
  }

  @Get('cqc-inspection-pack')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Generate unified CQC Regulation 18 Inspection Audit Pack',
  })
  cqcInspectionPack(
    @CurrentUser() user: any,
    @Query('organizationId') organizationId?: string,
  ) {
    const orgId = user.role === UserRole.ADMIN ? organizationId : user.organizationId;
    return this.reportsService.cqcInspectionPack(orgId);
  }
}