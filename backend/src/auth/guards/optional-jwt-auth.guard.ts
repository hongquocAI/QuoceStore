import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 🛡️ Guard "JWT tùy chọn" cho POST /orders: route này PHẢI vẫn cho khách
// vãng lai (không có cookie accessToken) đặt hàng được — không có JWT thì
// coi là guest, KHÔNG throw. Nhưng nếu request CÓ gửi cookie accessToken
// (đã đăng nhập), bắt buộc verify chữ ký như JwtAuthGuard bình thường: cookie
// sai/hết hạn phải trả 401 như cũ, KHÔNG được âm thầm rơi về guest (tránh
// che giấu lỗi phiên đăng nhập, và tránh dùng route này để dò JWT giả).
//
// Khác AuthGuard('jwt') mặc định: chỉ bỏ qua bước xác thực khi hoàn toàn
// KHÔNG có cookie; có cookie thì hành vi y hệt JwtAuthGuard (throw
// UnauthorizedException nếu verify thất bại, gắn req.user nếu hợp lệ).
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request?.cookies?.accessToken) {
      return true;
    }
    return super.canActivate(context);
  }
}
