import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Lấy Enum Role trực tiếp từ Prisma Schema của bạn

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);