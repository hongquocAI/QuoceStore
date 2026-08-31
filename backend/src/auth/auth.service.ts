import { Injectable, BadRequestException, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, GoogleLoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;
  private readonly googleClientId?: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    // ⚡ Chỉ khởi tạo OAuth2Client nếu đã cấu hình GOOGLE_CLIENT_ID.
    // Google Login hiện CHƯA được dùng thật ở QuoceStore -> để nguyên
    // client = null, method googleLogin() bên dưới sẽ tự chặn với thông
    // báo rõ ràng thay vì lỗi khó hiểu hoặc (tệ hơn) verify sai audience.
    if (this.googleClientId) {
      this.googleClient = new OAuth2Client(this.googleClientId);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH TOKEN HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Sinh cặp access + refresh token cho 1 user, lưu refresh token đã hash
   * (SHA-256) vào DB. Không bao giờ lưu raw token vào DB — nếu DB bị lộ,
   * kẻ tấn công vẫn không dùng được các token đã cấp trước đó.
   */
  private async issueTokenPair(user: { id: string; email: string; role: string }, meta?: { ip?: string; userAgent?: string }) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const hashedRefreshToken = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
        deviceIp: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Cấp lại access token mới từ 1 refresh token hợp lệ, đồng thời ROTATE:
   * thu hồi (revoke) refresh token cũ và phát hành 1 refresh token mới.
   * Rotation giúp phát hiện token bị đánh cắp: nếu 1 refresh token đã bị
   * revoke mà vẫn có người cố dùng lại, đó là dấu hiệu rõ ràng của việc
   * token đã bị lộ ra ngoài.
   */
  async refreshTokens(dto: RefreshTokenDto, meta?: { ip?: string; userAgent?: string }) {
    const hashedToken = this.hashToken(dto.refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    // Thu hồi token cũ trước khi cấp token mới (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokenPair(stored.user, meta);

    return {
      success: true,
      data: tokens,
    };
  }

  /**
   * Thu hồi 1 refresh token cụ thể (đăng xuất khỏi 1 thiết bị).
   */
  async logout(dto: RefreshTokenDto) {
    const hashedToken = this.hashToken(dto.refreshToken);
    // Dùng updateMany thay vì update để không throw lỗi nếu token không
    // tồn tại/đã bị xóa — logout luôn nên "thành công" từ góc nhìn client.
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revoked: true },
    });
    return { success: true, message: 'Đã đăng xuất.' };
  }

  // ─────────────────────────────────────────────────────────────
  // REGISTER / LOGIN / GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, meta?: { ip?: string; userAgent?: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng trên hệ thống.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: 'CUSTOMER',
      },
    });

    const tokens = await this.issueTokenPair(user, meta);

    return {
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ...tokens,
      },
    };
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const tokens = await this.issueTokenPair(user, meta);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        ...tokens,
      },
    };
  }

  async googleLogin(dto: GoogleLoginDto, meta?: { ip?: string; userAgent?: string }) {
    // ⚡ CHẶN SỚM: Google Login chưa được cấu hình — trả lỗi rõ ràng thay vì
    // cố verify với client rỗng. GOOGLE_CLIENT_ID vẫn optional ở Joi
    // (app.module.ts) có chủ đích, để backend không crash toàn bộ nếu biến
    // này thiếu ở môi trường nào đó — nhánh này là lớp bảo vệ graceful.
    if (!this.googleClient || !this.googleClientId) {
      throw new ServiceUnavailableException(
        'Đăng nhập bằng Google hiện chưa khả dụng. Vui lòng dùng email/mật khẩu.',
      );
    }

    // 🛡️ FIX QUAN TRỌNG (Nhóm G Đợt 2): `token` giờ BẮT BUỘC ở DTO
    // (@IsNotEmpty) — KHÔNG còn nhánh "bỏ qua verify nếu thiếu token" như
    // trước đây. `email`/`fullName` CHỈ được lấy từ payload đã verify chữ
    // ký, không bao giờ đọc từ `dto` (đã bị xóa khỏi DTO).
    let email: string;
    let fullName: string;
    let avatarUrl: string | undefined;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.token,
        audience: this.googleClientId, // 🛡️ bắt buộc để chặn giả mạo từ OAuth Client khác
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Không thể xác thực token Google.');
      }
      if (!payload.email_verified) {
        throw new UnauthorizedException('Email Google chưa được xác minh.');
      }
      email = payload.email;
      fullName = payload.name || 'Người dùng Google';
      avatarUrl = payload.picture;
    } catch (error) {
      // 🛡️ FIX: không nuốt message cụ thể (VD "Email Google chưa được xác
      // minh.") — chỉ bọc lại thành message chung cho lỗi THẬT SỰ không rõ
      // nguồn gốc (VD chữ ký JWT sai/hết hạn từ thư viện google-auth-library).
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token Google không hợp lệ hoặc đã hết hạn.');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: fullName || 'Người dùng Google',
          role: 'CUSTOMER',
          // Chỉ set avatar lúc TẠO MỚI — không ghi đè avatar user đã tự
          // upload qua Cloudinary nếu tài khoản đã tồn tại từ trước.
          avatarUrl: avatarUrl || null,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const tokens = await this.issueTokenPair(user, meta);

    return {
      success: true,
      message: 'Đăng nhập Google thành công',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl, // ⚡ FIX: đồng bộ với login() thường (trước đây thiếu field này)
        ...tokens,
      },
    };
  }
}
