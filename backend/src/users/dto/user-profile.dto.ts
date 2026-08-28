import { IsOptional, IsString, IsEnum, Matches, MaxLength, MinLength, IsNotEmpty } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @Matches(/^(\d{9}|\d{12})$/, { message: 'CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số' })
  cccd?: string;

  @IsOptional()
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 0)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  // 🛡️ FIX (Phase 1): dùng đúng enum Gender từ Prisma Client thay vì
  // @IsIn(['NAM','NU','KHAC']) tự viết tay — giờ TypeScript tự đảm bảo
  // giá trị gửi xuống Prisma luôn khớp kiểu, không cần ép kiểu thủ công
  // ở UsersService nữa (trước đây gây lỗi compile TS2322).
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsString()
  oldPassword: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}