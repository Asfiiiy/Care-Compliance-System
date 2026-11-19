import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Dashboard summary (org-scoped for manager/staff)' })
  summary(
    @CurrentUser() user: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const orgId =
      user.role === UserRole.ADMIN ? undefined : user.organizationId;
    const incInactive = includeInactive === 'true';
    return this.dashboardService.getSummary(orgId, incInactive);
  }

  @Get('admin-summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin global system summary' })
  adminSummary() {
    return this.dashboardService.getAdminSummary();
  }

  @Get('top-organizations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Top performing organizations (admin only)' })
  topOrganizations() {
    return this.dashboardService.getTopOrganizations();
  }

  @Get('recent-activity')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Recent platform activity (admin only)' })
  recentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('recent-notifications')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Recent notifications (org-scoped)' })
  recentNotifications(@CurrentUser() user: any) {
    const orgId =
      user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.dashboardService.recentNotifications(orgId);
  }

  @Get('expiring-certificates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Expiring certificates (org-scoped)' })
  expiringCertificates(@CurrentUser() user: any) {
    const orgId =
      user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.dashboardService.expiringCertificates(orgId);
  }

  @Get('expiring-trainings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Expiring trainings (org-scoped)' })
  expiringTrainings(@CurrentUser() user: any) {
    const orgId =
      user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.dashboardService.expiringTrainings(orgId);
  }
}