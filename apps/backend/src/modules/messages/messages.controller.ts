import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { SendWarningDto } from './dto/send-warning.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages & Compliance Warnings')
@ApiBearerAuth('JWT')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get list of conversations and unread counts' })
  async getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user);
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get total unread message count for badge' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.sub);
  }

  @Get(':otherUserId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get message thread with a specific user' })
  async getMessages(
    @Param('otherUserId') otherUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.getMessages(user.sub, otherUserId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Send direct chat message' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.sendMessage(user.sub, user.organizationId, dto);
  }

  @Post('send-warning')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Dispatch 3-channel CQC compliance warning (Email + Notification + Direct Chat)',
  })
  async sendWarning(
    @Body() dto: SendWarningDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.sendWarning(user, dto);
  }
}
