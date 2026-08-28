import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách role được phép truy cập từ Decorator `@Roles`
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu route không yêu cầu phân quyền cụ thể, cho phép đi qua
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin user từ request (đã được gắn vào từ JwtAuthGuard chạy trước đó)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Từ chối truy cập: Không tìm thấy thông tin xác thực quyền hạn.');
    }

    // 3. Kiểm tra xem role của user có nằm trong danh sách cho phép không
    const hasPermission = requiredRoles.includes(user.role);
    if (!hasPermission) {
      throw new ForbiddenException(`Từ chối truy cập: Tài khoản với quyền [${user.role}] không có quyền thực hiện hành động này.`);
    }

    return true;
  }
}