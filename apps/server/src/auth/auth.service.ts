import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { LoginDto, RegisterDto } from './auth.dto';

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

type TokenPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  private users = new Map<string, UserRecord>();
  private refreshTokenOwnerByToken = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    if (this.users.has(dto.email)) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user: UserRecord = {
      id: randomUUID(),
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
    };
    this.users.set(user.email, user);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = this.users.get(dto.email);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const ownerId = this.refreshTokenOwnerByToken.get(refreshToken);

    if (!ownerId || ownerId !== payload.sub) {
      throw new UnauthorizedException('Refresh token was revoked');
    }

    this.refreshTokenOwnerByToken.delete(refreshToken);

    const user = this.findUserOrThrow(payload.email);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    this.refreshTokenOwnerByToken.delete(refreshToken);
    return { ok: true };
  }

  async me(accessToken: string) {
    const payload = await this.verifyAccessToken(accessToken);
    const user = this.findUserOrThrow(payload.email);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  private async issueTokens(user: UserRecord) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
        expiresIn: process.env.JWT_ACCESS_TTL || '900s',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
        expiresIn: process.env.JWT_REFRESH_TTL || '30d',
      },
    );

    this.refreshTokenOwnerByToken.set(refreshToken, user.id);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async verifyAccessToken(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private findUserOrThrow(email: string) {
    const user = this.users.get(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
