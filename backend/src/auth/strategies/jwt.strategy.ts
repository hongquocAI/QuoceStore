import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super({
      // 🛡️ FIX QUAN TRỌNG: đọc token TỪ COOKIE HttpOnly thay vì từ header
      // "Authorization: Bearer ...". Đây là thay đổi cốt lõi của Nhóm A.
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.accessToken || null;
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}