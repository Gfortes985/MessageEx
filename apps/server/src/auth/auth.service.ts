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

@Injectable()
export class AuthService {
  private users = new Map<string, UserRecord>();

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

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = this.users.get(dto.email);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
      });
      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout() {
    return { ok: true };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
        expiresIn: process.env.JWT_ACCESS_TTL || '900s',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
        expiresIn: process.env.JWT_REFRESH_TTL || '30d',
      },
    );

    return { accessToken, refreshToken };
  }
}
