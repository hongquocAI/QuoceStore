import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';
import { AiModule } from './ai/ai.module';
import { ProductModule } from './product/product.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountsModule } from './discounts/discounts.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BrandsModule } from './brands/brands.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { HealthModule } from './health/health.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(5000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        PAYOS_CLIENT_ID: Joi.string().required(),
        PAYOS_API_KEY: Joi.string().required(),
        PAYOS_CHECKSUM_KEY: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().required(),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GEMINI_API_KEY: Joi.string().optional(),
        REDIS_URL: Joi.string().required(),
        SENTRY_DSN: Joi.string().optional(),
        NODE_ENV: Joi.string().optional(),
      }),
    }),

    // 🛡️ Rate-limiting toàn cục — mỗi IP tối đa 100 request/60s cho mọi
    // endpoint không có @Throttle riêng. /health được loại trừ (hosting
    // platform ping liên tục để kiểm tra server sống).
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
      ],
      skipIf: (context) => context.switchToHttp().getRequest().url === '/health',
    }),

    // 🛡️ FIX: Đây là khối ĐỘC LẬP, KHÔNG còn lồng bên trong
    // ThrottlerModule.forRoot() như bản lỗi trước — Cache Redis cho dữ
    // liệu ít thay đổi (category tree, brand list, subcategory list).
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [createKeyv(configService.get<string>('REDIS_URL')!)],
      }),
      inject: [ConfigService],
    }),

    // Structured logging (Pino) — JSON có cấu trúc, tự động che field
    // nhạy cảm (password, token, cookie) khỏi log.
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'req.body.password',
            'req.body.oldPassword',
            'req.body.newPassword',
            'req.body.cccd',
            'res.headers["set-cookie"]',
          ],
          censor: '***REDACTED***',
        },
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
      },
    }),

    PrismaModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    PaymentModule,
    AiModule,
    ProductModule,
    OrdersModule,
    DiscountsModule,
    BrandsModule,
    SubCategoriesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}