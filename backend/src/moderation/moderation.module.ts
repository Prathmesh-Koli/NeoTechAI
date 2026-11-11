import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}