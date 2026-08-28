import axios from 'axios';
import { ENV } from '@/config/env';

export const api = axios.create({
  baseURL: ENV.apiUrl,
  withCredentials: true, // ⚡ BẮT BUỘC — để trình duyệt tự động gửi kèm cookie HttpOnly
  headers: { 'Content-Type': 'application/json' },
});

// 🛡️ FIX: KHÔNG còn request interceptor gắn Authorization header nữa —
// cookie HttpOnly được trình duyệt tự động đính kèm mọi request nhờ
// `withCredentials: true`, JavaScript không cần (và không thể) đọc token
// để tự gắn vào header như trước.

// Các endpoint dưới đây KHÔNG nên tự động redirect về /login khi 401 —
// đây là các lời gọi "kiểm tra trạng thái" chạy ngầm, không phải hành
// động rõ ràng của người dùng. VD: khách chưa đăng nhập ghé trang chủ,
// AuthContext âm thầm gọi /auth/me để kiểm tra — 401 ở đây là BÌNH THƯỜNG
// (chưa đăng nhập), không nên bị đá về trang login.
const SILENT_401_URLS = ['/auth/me', '/auth/login', '/auth/register', '/auth/refresh'];

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isSilentEndpoint = SILENT_401_URLS.some((u) => url.includes(u));
      if (isSilentEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ⚡ Không cần gửi body gì — refreshToken nằm trong cookie, trình
        // duyệt tự gửi kèm. Backend set lại cookie mới qua Set-Cookie,
        // JS không cần đọc/lưu gì cả.
        await axios.post(`${ENV.apiUrl}/auth/refresh`, {}, { withCredentials: true });

        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];

        return api(originalRequest);
      } catch (refreshError) {
        pendingQueue = [];
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);