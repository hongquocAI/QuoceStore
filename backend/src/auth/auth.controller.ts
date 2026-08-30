import { Controller, Post, Get, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleLoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getRequestMeta } from '../common/utils/request-meta';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 phút — khớp với JwtModule expiresIn
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // 🛡️ FIX QUAN TRỌNG NHẤT của Nhóm A: token giờ được gửi qua cookie
  // HttpOnly, KHÔNG còn trả trong JSON body nữa. JavaScript ở Frontend
  // (kể cả script độc hại nếu có lỗ hổng XSS ở đâu đó) KHÔNG THỂ đọc được
  // giá trị cookie này — loại bỏ hoàn toàn bề mặt tấn công "đánh cắp token
  // qua XSS" mà localStorage vốn có.
  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProd, // bắt buộc HTTPS khi production, cho phép HTTP khi dev local
      sameSite: 'lax', // chống CSRF cơ bản (cookie không gửi kèm request cross-site từ link/form bên ngoài)
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      // ⚡ path giới hạn chỉ '/auth' — refreshToken CHỈ được trình duyệt
      // gửi kèm khi gọi các endpoint /auth/*, giảm bề mặt lộ so với gửi
      // kèm mọi request (accessToken mới cần path '/' vì dùng cho mọi API).
      path: '/auth',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth' });
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto, getRequestMeta(req));
    this.setAuthCookies(res, result.data);
    const { accessToken, refreshToken, ...userData } = result.data;
    return { ...result, data: userData };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, getRequestMeta(req));
    this.setAuthCookies(res, result.data);
    const { accessToken, refreshToken, ...userData } = result.data;
    return { ...result, data: userData };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleLogin(dto, getRequestMeta(req));
    this.setAuthCookies(res, result.data);
    const { accessToken, refreshToken, ...userData } = result.data;
    return { ...result, data: userData };
  }

  // ⚡ MỚI: đọc refreshToken TỪ COOKIE (không còn nhận qua body nữa) —
  // Frontend chỉ cần gọi POST /auth/refresh KHÔNG kèm body gì cả, trình
  // duyệt tự động đính kèm cookie refreshToken.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy phiên đăng nhập, vui lòng đăng nhập lại.');
    }
    const result = await this.authService.refreshTokens({ refreshToken }, getRequestMeta(req));
    this.setAuthCookies(res, result.data);
    return { success: true, message: 'Làm mới phiên đăng nhập thành công' };
  }

  // ⚡ MỚI: đọc refreshToken từ cookie để thu hồi ở DB, rồi xóa sạch cookie
  // ở trình duyệt.
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout({ refreshToken });
    }
    this.clearAuthCookies(res);
    return { success: true, message: 'Đã đăng xuất.' };
  }

  // ⚡ MỚI: endpoint để Frontend kiểm tra "mình có đang đăng nhập không"
  // mà không cần tự đọc token (vì cookie HttpOnly, JS không đọc được).
  // JwtAuthGuard tự validate cookie, nếu hợp lệ trả về thông tin user.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return { success: true, data: req.user };
  }
}