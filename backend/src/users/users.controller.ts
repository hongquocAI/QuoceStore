import {
  Controller,
  Patch,
  Param,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard) // 🛡️ FIX QUAN TRỌNG NHẤT: TOÀN BỘ route trong controller này
// trước đây KHÔNG có bất kỳ Guard nào — ai cũng đọc/sửa được CCCD, SĐT, địa chỉ,
// avatar, thậm chí đổi mật khẩu của bất kỳ user nào chỉ cần biết UUID.
// Áp Guard ở cấp Controller để không thể vô tình quên ở 1 route mới sau này.
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Helper dùng chung: chỉ chính chủ tài khoản hoặc ADMIN mới được thao tác.
  private assertOwnerOrAdmin(req: any, targetId: string) {
    const isOwner = req.user.id === targetId;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên tài khoản này.');
    }
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Req() req: any) {
    this.assertOwnerOrAdmin(req, id);
    return this.usersService.findById(id);
  }

  // ⚡ Đã gộp lại: chỉ còn 1 route cập nhật thông tin hồ sơ (JSON thuần,
  // không kèm file nữa) — tránh trùng lặp với /avatar bên dưới, và dùng
  // đúng DTO có validate thay vì `any`.
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto, @Req() req: any) {
    this.assertOwnerOrAdmin(req, id);
    return this.usersService.updateProfile(id, dto);
  }

  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto, @Req() req: any) {
    this.assertOwnerOrAdmin(req, id);
    return this.usersService.changePassword(id, dto);
  }

  @Patch(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 🛡️ FIX: giới hạn 5MB, tránh DoS qua upload file khổng lồ
    }),
  )
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    this.assertOwnerOrAdmin(req, id);
    return this.usersService.updateAvatar(id, file);
  }
}
