import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { PrismaService } from '../../../database/prisma.service';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        config.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<JwtPayload> {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },

        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          organizationId: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'User no longer exists.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact your administrator.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    };
  }
}