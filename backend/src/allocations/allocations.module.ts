import { Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller.js';
import { AllocationsService } from './allocations.service.js';

@Module({
  controllers: [AllocationsController],
  providers: [AllocationsService],
})
export class AllocationsModule {}
