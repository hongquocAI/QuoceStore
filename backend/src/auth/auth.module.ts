import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 🛡️ FIX: Đây giờ là NƠI DUY NHẤT cấu hình JwtModule trong toàn bộ
    // ứng dụng (trước đây bị lặp lại ở AppModule nữa, đã xóa bên đó).
    // Dùng registerAsync + ConfigService thay vì `process.env.JWT_SECRET ||
    // 'your_secret_key_sieu_bi_mat'` — không còn fallback hardcode nguy
    // hiểm. Nếu thiếu JWT_SECRET, Joi ở app.module.ts đã chặn app khởi
    // động từ trước rồi, nên ở đây get() luôn chắc chắn có giá trị thật.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // ⚡ Giờ có thể rút ngắn xuống 15 PHÚT một cách an toàn — vì đã có
        // Refresh Token đầy đủ (xem auth.service.ts). Frontend sẽ tự động
        // gọi /auth/refresh khi access token hết hạn, người dùng không hề
        // cảm nhận được việc bị "đăng xuất" giữa chừng.
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    JwtModule, // ⚡ export để các module khác (Orders, Products, Users, Cloudinary...) dùng chung đúng 1 cấu hình JWT
  ],
})
export class AuthModule {}

/**
 * ✅ CẬP NHẬT: Refresh Token đã được implement đầy đủ (auth.service.ts:
 * issueTokenPair / refreshTokens / logout, dùng bảng RefreshToken sẵn có
 * trong schema, lưu token đã HASH SHA-256, có rotation mỗi lần refresh).
 * Nhờ vậy access token có thể an toàn rút ngắn xuống 15 phút — cửa sổ rủi
 * ro nếu access token bị lộ (XSS...) giờ chỉ còn tối đa 15 phút thay vì
 * 7 ngày như code gốc ban đầu.
 *
 * 🔜 Việc còn lại (Phase 2, không khẩn cấp): chuyển JWT + refresh token từ
 * localStorage sang cookie HttpOnly để loại bỏ hoàn toàn rủi ro XSS đọc
 * được token. Hiện tại vẫn dùng localStorage để nhất quán với luồng
 * Frontend đang có, tránh thay đổi quá nhiều thứ cùng lúc.
 */
