import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { AdjustMarksDto } from './dto/adjust-marks.dto.js';
import {
  ApproveDto,
  RequestRecheckDto,
  ReturnForRevisionDto,
} from './dto/moderation-actions.dto.js';
import { ModerationService } from './moderation.service.js';

// Every route below is Chief Evaluator only: JwtAuthGuard authenticates,
// RolesGuard rejects any other role with 403.
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CHIEF_EVALUATOR')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('allocations')
  getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.moderationService.getQueue(user);
  }

  @Get('allocations/:id')
  getDetail(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.moderationService.getDetail(id, user);
  }

  @Get('allocations/:id/audit-log')
  getAuditLog(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.moderationService.getAuditLog(id, user);
  }

  @Patch('allocations/:id/marks')
  adjustMarks(
    @Param('id') id: string,
    @Body() dto: AdjustMarksDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.adjustMarks(id, user, dto);
  }

  @Post('allocations/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.approve(id, user, dto);
  }

  @Post('allocations/:id/return')
  returnForRevision(
    @Param('id') id: string,
    @Body() dto: ReturnForRevisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.returnForRevision(id, user, dto);
  }

  @Post('allocations/:id/recheck')
  requestRecheck(
    @Param('id') id: string,
    @Body() dto: RequestRecheckDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.requestRecheck(id, user, dto);
  }
}
