import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all users' })
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new user account (Admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('clear-mock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clear all mock database data (Admin only)' })
  clearMock(@CurrentUser() user: any) {
    return this.usersService.clearMockData(user.id);
  }

  @Get('organizations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get list of organizations (Admin only)' })
  findAllOrganizations() {
    return this.usersService.findAllOrganizations();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user account (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user account (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}