import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CHIEF_EVALUATOR')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('allocations')
  async getPendingAllocations() {
    return this.moderationService.getPendingAllocations();
  }

  @Get('allocations/:id')
  async getScriptDetails(@Param('id') id: string) {
    return this.moderationService.getScriptDetails(id);
  }

  @Post('allocations/:id/action')
  async performAction(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { action: 'APPROVE' | 'RETURN_FOR_REVISION' | 'RECHECK'; marks?: any; comments?: string; reason?: string },
  ) {
    const userId = req.user?.id;
    // Map frontend action strings to service-expected types
    let mappedAction: 'APPROVE' | 'RETURN' | 'RECHECK' | 'ADJUST_MARKS' = 'APPROVE';
    if (body.action === 'RETURN_FOR_REVISION') mappedAction = 'RETURN';
    if (body.action === 'RECHECK') mappedAction = 'RECHECK';
    if (body.action === 'APPROVE') mappedAction = 'APPROVE';

    return this.moderationService.performAction(id, userId, mappedAction, body);
  }
}