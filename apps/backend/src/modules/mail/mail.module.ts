import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
        const port = Number(configService.get('MAIL_PORT')) || 587;
        const user = configService.get<string>('MAIL_USER');
        const pass = configService.get<string>('MAIL_PASSWORD');
        const from = configService.get<string>('MAIL_FROM');

        if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_app_password' || pass === 'your_16_char_app_password_here') {
          console.warn('\n⚠️  [MAIL CONFIG] SMTP credentials not configured!');
          console.warn('    Set MAIL_USER and MAIL_PASSWORD in apps/backend/.env');
          console.warn('    Credential emails will NOT be sent until this is fixed.\n');
        } else {
          console.log(`\n✅ [MAIL CONFIG] SMTP configured: ${user} → ${host}:${port}\n`);
        }

        return {
          transport: {
            host,
            port,
            secure: false, // STARTTLS on port 587
            requireTLS: true,
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false, // allow self-signed in dev
            },
          },
          defaults: {
            from: from || `"Care Compliance" <${user}>`,
          },
        };
      },
    }),
  ],

  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}