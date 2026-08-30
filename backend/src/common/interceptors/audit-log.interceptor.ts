import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';
import { getRequestMeta } from '../utils/request-meta';

const REDACTED_BODY_KEYS = [
  'password',
  'newPassword',
  'oldPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'cccd',
];

// Interceptor CHỈ ghi audit log trên route có @Audit() gắn tường minh — không
// đụng vào response, không chạy trên route không khai báo. Khác hẳn với
// TransformInterceptor đã bị rút lại (xem CLAUDE.md nguyên tắc #7).
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.getAllAndOverride<AuditMeta>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const { ip, userAgent } = getRequestMeta(req);
    const userId: string | undefined = req.user?.id;
    const entityIdFromParams: string | undefined = req.params?.id;
    const redactedBody = this.redactBody(req.body);

    return next.handle().pipe(
      tap((response) => {
        const entityId = entityIdFromParams ?? this.extractEntityId(response);
        void this.write({
          userId,
          action: meta.action,
          entityType: meta.entityType,
          entityId,
          metadata: { success: true, body: redactedBody },
          ipAddress: ip,
          userAgent,
        });
      }),
      catchError((error) => {
        void this.write({
          userId,
          action: meta.action,
          entityType: meta.entityType,
          entityId: entityIdFromParams,
          metadata: {
            success: false,
            errorMessage: error?.message,
            body: redactedBody,
          },
          ipAddress: ip,
          userAgent,
        });
        throw error;
      }),
    );
  }

  private extractEntityId(response: any): string | undefined {
    return response?.id ?? response?.data?.id;
  }

  private redactBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }
    const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    for (const key of REDACTED_BODY_KEYS) {
      if (key in clone) {
        clone[key] = '[REDACTED]';
      }
    }
    return clone;
  }

  private async write(entry: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (err) {
      // Audit log hỏng TUYỆT ĐỐI không được làm gãy request nghiệp vụ.
      this.logger.error('Ghi audit log thất bại', err as Error);
    }
  }
}
