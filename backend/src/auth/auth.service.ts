import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verify as verifyTotp } from 'otplib';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AccessTokenPayload,
  MfaTokenPayload,
  RefreshTokenPayload,
} from './types.js';

type SessionSubject = Pick<User, 'id' | 'tenantId' | 'role'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.totpSecret) {
      // No 2FA enrolled yet -- fall back to issuing a full session directly.
      return { mfaRequired: false as const, ...this.issueSessionTokens(user) };
    }

    const payload: MfaTokenPayload = { sub: user.id, purpose: 'mfa' };
    const mfaToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_MFA_SECRET'),
      expiresIn: '5m',
    });
    return { mfaRequired: true as const, mfaToken };
  }

  async verifyOtp(mfaToken: string, code: string) {
    let payload: MfaTokenPayload;
    try {
      payload = this.jwt.verify<MfaTokenPayload>(mfaToken, {
        secret: this.config.getOrThrow<string>('JWT_MFA_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'MFA challenge expired or invalid, please log in again',
      );
    }
    if (payload.purpose !== 'mfa') {
      throw new UnauthorizedException('Invalid MFA token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive || !user.totpSecret) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await verifyTotp({ secret: user.totpSecret, token: code });
    if (!result.valid) {
      throw new UnauthorizedException('Invalid one-time code');
    }

    return this.issueSessionTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
    if (payload.purpose !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accessToken: this.signAccessToken(user) };
  }

  private issueSessionTokens(user: SessionSubject) {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  private signAccessToken(user: SessionSubject) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      purpose: 'access',
    };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
  }

  private signRefreshToken(user: SessionSubject) {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      purpose: 'refresh',
    };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }
}
