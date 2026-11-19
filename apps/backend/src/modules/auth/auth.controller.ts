import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';

import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}



  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset OTP',
  })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with OTP',
  })
  resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Get('organizations')
  @ApiOperation({
    summary: 'Get list of active care homes for carer registration',
  })
  getOrganizations() {
    return this.authService.getPublicOrganizations();
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new Care Home and Manager account',
  })
  register(
    @Body() dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login',
  })
  login(
    @Body() dto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
  })
  refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get current user',
  })
  getCurrentUser(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.me(user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Logout',
  })
  async logout(
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.authService.logout(user.sub);
  }

  @Public()
  @Get('invitation-info/:token')
  @ApiOperation({
    summary: 'Get email and organization details for invitation token',
  })
  getInvitationInfo(@Param('token') token: string) {
    return this.authService.getInvitationInfo(token);
  }

  @Public()
  @Post('activate-account')
  @ApiOperation({
    summary: 'Activate invited user account and set password',
  })
  activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activateAccount(dto);
  }
}