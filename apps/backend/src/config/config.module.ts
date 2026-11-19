import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { envSchema } from './env/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: '.env',

      validate(config) {
        return envSchema.parse(config);
      },
    }),

    ScheduleModule.forRoot(),
  ],
})
export class AppConfigModule {}