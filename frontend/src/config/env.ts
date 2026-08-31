/**
 * 🛡️ Enterprise Environment Configuration
 * Quản lý và kiểm tra tính hợp lệ của các biến môi trường phía Frontend.
 */
class EnvironmentConfig {
  get apiUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_URL;
    
    if (!url) {
      throw new Error(
        '❌ [Enterprise Config Error]: Biến môi trường NEXT_PUBLIC_API_URL chưa được cấu hình trong tệp .env!'
      );
    }
    
    return url;
  }

  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // ⚡ Nhóm G Đợt 2 (Phần B): KHÔNG throw như apiUrl — nếu thiếu, nút Google
  // Login tự ẩn graceful (xem login/register page.tsx) thay vì crash cả
  // trang. Google Login là tính năng phụ trợ, không phải lõi hệ thống.
  get googleClientId(): string | undefined {
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  }
}

export const ENV = new EnvironmentConfig();