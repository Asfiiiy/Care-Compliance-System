import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CopilotService } from './copilot.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Copilot')
@ApiBearerAuth('JWT')
@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Get('forecast')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Compliance Score Risk Forecasting' })
  getForecast(@CurrentUser() user: any) {
    const orgId = user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.copilotService.getRiskForecast(orgId);
  }

  @Post('chat')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Chat with AI Compliance Auditor' })
  chat(
    @Body() body: { prompt: string },
    @CurrentUser() user: any,
  ) {
    const orgId = user.role === UserRole.ADMIN ? undefined : user.organizationId;
    return this.copilotService.getChatResponse(body.prompt, orgId);
  }
}
