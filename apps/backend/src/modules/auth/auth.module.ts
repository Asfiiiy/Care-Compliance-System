import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../database/prisma.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,

    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          expiresIn: config.getOrThrow<string>(
            'JWT_ACCESS_EXPIRES',
          ) as any,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}