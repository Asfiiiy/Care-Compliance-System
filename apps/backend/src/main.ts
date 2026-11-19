import {
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

import helmet from 'helmet';
import compression from 'compression';

import { join } from 'path';
import {
  existsSync,
  mkdirSync,
} from 'fs';

import { AppModule } from './app.module';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
      {
        bufferLogs: true,
      },
    );

  const logger = new Logger('Bootstrap');

  const configService =
    app.get(ConfigService);

  const apiPrefix =
    configService.get<string>('API_PREFIX') ??
    'api';

  const port =
    configService.get<number>('PORT') ??
    3000;

  const nodeEnv =
    configService.get<string>('NODE_ENV') ??
    'development';

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    }),
  );

  app.use(compression());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  /**
   * --------------------------------------------------------
   * Uploads
   * --------------------------------------------------------
   */

  const uploadsPath = join(
    process.cwd(),
    'uploads',
  );

  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, {
      recursive: true,
    });
  }

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('X-Frame-Options');
    },
  });

  /**
   * --------------------------------------------------------
   * Swagger
   * --------------------------------------------------------
   */

  if (nodeEnv !== 'production') {
    const swaggerConfig =
      new DocumentBuilder()
        .setTitle(
          'Care Compliance API',
        )
        .setDescription(
          'Enterprise Care Compliance Management System API',
        )
        .setVersion('1.0.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          'JWT',
        )
        .build();

    const document =
      SwaggerModule.createDocument(
        app,
        swaggerConfig,
      );

    SwaggerModule.setup(
      `${apiPrefix}/docs`,
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
        },
      },
    );

    logger.log(
      `📘 Swagger: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }

  await app.listen(port);

  logger.log(
    `🚀 API running at http://localhost:${port}/${apiPrefix}`,
  );

  logger.log(
    `📂 Uploads served at http://localhost:${port}/uploads`,
  );

  logger.log(
    `🌍 Environment: ${nodeEnv}`,
  );
}

void bootstrap();