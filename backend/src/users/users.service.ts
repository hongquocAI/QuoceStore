import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user-profile.dto';
import * as bcrypt from 'bcrypt';

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          address: dto.address,
          cccd: dto.cccd,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        },
      });
      const { passwordHash, ...safeUser } = updatedUser;
      return { success: true, message: 'Cập nhật thông tin thành công', data: safeUser };
    } catch (error: any) {
      // 🛡️ FIX: trước đây MỌI lỗi (kể cả lỗi lạ từ Prisma) đều bị nuốt thành
      // 1 message chung chung "Không tìm thấy người dùng hoặc lỗi cập nhật."
      // Giờ log chi tiết thật ở server để debug được, chỉ trả message chung cho client.
      this.logger.error(`Lỗi cập nhật hồ sơ user ${id}`, error?.stack || error);
      throw new BadRequestException('Không thể cập nhật thông tin, vui lòng thử lại.');
    }
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mật khẩu hiện tại không chính xác.');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true, message: 'Đổi mật khẩu thành công!' };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    const { passwordHash, ...result } = user;
    return { success: true, data: result };
  }

  async updateAvatar(id: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy tệp ảnh tải lên.');
    }

    // 🛡️ FIX: validate mimetype trước khi đẩy lên Cloudinary — trước đây
    // chấp nhận BẤT KỲ file nào (kể cả .exe đổi tên đuôi, SVG chứa script...).
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    // Đường dẫn chuẩn Enterprise: tách biệt hoàn toàn khỏi thư mục sản phẩm
    const folderPath = `quoce-store/users/${id}/avatars`;
    const uploadResult = await this.cloudinaryService.uploadCustomImage(file, folderPath);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: uploadResult.secure_url },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return { success: true, message: 'Cập nhật ảnh đại diện thành công', data: safeUser };
  }
}
