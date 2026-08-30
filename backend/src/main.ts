import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  // 🛡️ Sentry Error Tracking — PHẢI khởi tạo SỚM, ngay sau khi có app +
  // configService, trước mọi middleware khác. Đây là đoạn trước đó bị
  // thiếu hoàn toàn trong file của bạn.
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('NODE_ENV') || 'development',
      tracesSampleRate: 0.2,
    });
  }

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'data'), {
    prefix: '/data',
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(configService.get<number>('PORT') || 5000);
}
bootstrap();