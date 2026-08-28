import axios from 'axios';
import { ENV } from '@/config/env';

// ⚡ FIX: Dùng ENV.apiUrl (nguồn chân lý duy nhất, xem config/env.ts) thay
// vì hardcode 'http://localhost:5000' — đây chính là file đã khiến build
// production trước đây vẫn âm thầm gọi localhost dù đã đổi domain thật.
export const api = axios.create({
  baseURL: ENV.apiUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}

function setRefreshToken(token: string) {
  localStorage.setItem('refreshToken', token);
}

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ⚡ Request interceptor: gắn access token — CHỈ đọc đúng 1 key
// ('accessToken'), không còn "dò" qua 6-7 key khác nhau như code cũ.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚡ MỚI: Response interceptor — khi access token hết hạn (401), tự động
// gọi /auth/refresh để lấy token mới rồi RETRY lại đúng request vừa lỗi,
// người dùng hoàn toàn không cảm nhận được việc token đã hết hạn.
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuthStorage();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      // Nếu đã có 1 request khác đang refresh, các request sau xếp hàng chờ
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${ENV.apiUrl}/auth/refresh`, { refreshToken });
        const newTokens = res.data.data;
        setAccessToken(newTokens.accessToken);
        setRefreshToken(newTokens.refreshToken); // rotation: token cũ đã bị revoke ở server

        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];

        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
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
