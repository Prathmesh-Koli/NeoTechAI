import type { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  role: Role;
  purpose: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tenantId: string;
  role: Role;
  purpose: 'refresh';
}

export interface MfaTokenPayload {
  sub: string;
  purpose: 'mfa';
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: Role;
}
