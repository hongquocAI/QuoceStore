import { Controller, Get, Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

// ⚡ FIX: export class này ra để health.module.ts đăng ký được vào
// providers (trước đây thiếu export, DI không nhận diện được).
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: 'Không kết nối được Database' });
    }
  }
}

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prismaIndicator.isHealthy('database')]);
  }
}