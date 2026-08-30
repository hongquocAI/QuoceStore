import type { Request } from 'express';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

// Ưu tiên x-forwarded-for (IP thật của client khi đứng sau proxy/load balancer)
// trước req.ip, vì req.ip gần như luôn truthy (kể cả địa chỉ nội bộ của proxy)
// nên đặt sau sẽ không bao giờ được dùng tới.
export function getRequestMeta(req: Request): RequestMeta {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim();

  return {
    ip: forwardedIp || req.ip || undefined,
    userAgent: req.headers['user-agent'] || undefined,
  };
}
