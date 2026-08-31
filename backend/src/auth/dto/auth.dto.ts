import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

// 🛡️ FIX QUAN TRỌNG (Nhóm G Đợt 2, Phần B): trước đây `token` optional và
// DTO còn nhận cả `email`/`fullName` — client có thể bỏ qua `token` hoàn
// toàn và tự khai `email` bất kỳ, khiến AuthService.googleLogin() bỏ qua
// verify chữ ký Google (nhánh `if (dto.token)`), tìm-hoặc-tạo tài khoản
// theo email client tự gửi. Đây là lỗ hổng chiếm đoạt tài khoản. Giờ
// `token` BẮT BUỘC, và `email`/`fullName` KHÔNG còn nhận từ client nữa —
// 2 field đó CHỈ được lấy từ payload đã verify chữ ký (xem auth.service.ts).
export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Thiếu token xác thực Google.' })
  token: string;
}