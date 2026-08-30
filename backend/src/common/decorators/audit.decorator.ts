import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_meta';

export interface AuditMeta {
  action: string;
  entityType?: string;
}

export const Audit = (action: string, entityType?: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } satisfies AuditMeta);
