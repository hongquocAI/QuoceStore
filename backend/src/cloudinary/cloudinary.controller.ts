import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// ⚡ Chỉ cho phép folder nằm trong đúng cấu trúc phân tầng Enterprise đã
// thiết kế: quoce-store/products/... hoặc quoce-store/users/...
// Chặn hoàn toàn việc client tự đặt folder tùy ý (kể cả cố tình gõ path lạ).
const ALLOWED_FOLDER_PATTERN = /^quoce-store\/(products|users)\/[a-zA-Z0-9/_-]+$/;

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VENDOR)
// 🛡️ FIX QUAN TRỌNG NHẤT: endpoint này trước đây HOÀN TOÀN PUBLIC — bất kỳ
// ai cũng upload được ảnh lên Cloudinary bằng account của bạn (tốn storage/
// bandwidth, rủi ro bị lợi dụng host nội dung xấu). Giờ chỉ ADMIN/VENDOR
// đã đăng nhập mới gọi được.
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  // 🛡️ MỚI (Phase 2): tối đa 20 upload/phút/IP — dù đã có Auth Guard,
  // vẫn nên chặn kịch bản lỗi (script Admin chạy vòng lặp vô hạn, hoặc
  // token Admin bị lộ bị lợi dụng spam upload tốn storage Cloudinary).
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 }, // 🛡️ FIX: giới hạn 8MB, tránh DoS
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy tệp hình ảnh tải lên.');
    }

    // 🛡️ FIX: validate mimetype — chỉ nhận ảnh thật
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.');
    }

    // 🛡️ FIX QUAN TRỌNG: không còn fallback 'quoce-products' (root folder chung
    // vi phạm chính nguyên tắc "never fallback to root generic folder" của dự án),
    // và bắt buộc folder phải khớp đúng cấu trúc phân tầng đã thiết kế.
    if (!folder || !ALLOWED_FOLDER_PATTERN.test(folder)) {
      throw new BadRequestException(
        'Tham số folder không hợp lệ. Folder phải có dạng "quoce-store/products/..." hoặc "quoce-store/users/...".',
      );
    }

    const uploadResult = await this.cloudinaryService.uploadCustomImage(file, folder);

    return {
      success: true,
      message: 'Tải ảnh lên Cloudinary thành công',
      url: uploadResult.secure_url,
    };
  }
}
