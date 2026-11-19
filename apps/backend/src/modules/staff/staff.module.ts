import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { MailModule } from '../mail/mail.module';

import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}