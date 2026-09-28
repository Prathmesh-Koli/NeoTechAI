import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { UsersService } from './users.service.js';

// Tenant scoping comes from the authenticated user's JWT claim, never from a
// client-supplied id -- that's what stops one tenant from reading another's
// user list.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAllForTenant(user.tenantId);
  }
}
