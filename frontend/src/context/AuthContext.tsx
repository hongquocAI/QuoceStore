"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  cccd?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  loyaltyPoints?: number;
  role?: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ FIX: Không còn kiểm tra "có token trong localStorage không" (vì
  // giờ token nằm trong cookie HttpOnly, JS không đọc được). Thay vào đó,
  // LUÔN gọi /auth/me lúc mount — cookie tự động gửi kèm nếu có, backend
  // tự xác nhận còn hợp lệ hay không. 401 ở đây là bình thường (khách
  // chưa đăng nhập), interceptor đã được cấu hình để KHÔNG redirect
  // trong trường hợp này (xem lib/api.ts).
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get('/auth/me');
        const basicUser = res.data.data; // { id, email, role } từ JwtStrategy

        // Lấy đầy đủ hồ sơ (avatarUrl, fullName...) qua endpoint users
        const fullRes = await api.get(`/users/${basicUser.id}`);
        const fullProfile = fullRes.data.data || fullRes.data;

        setUser(fullProfile);
        localStorage.setItem('user', JSON.stringify(fullProfile)); // chỉ cache hồ sơ hiển thị, KHÔNG chứa token
      } catch (err) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ⚡ FIX: login() giờ chỉ nhận và lưu THÔNG TIN HỒ SƠ (không có
  // accessToken/refreshToken nữa — 2 field đó đã bị Backend loại khỏi
  // response body, chỉ tồn tại dưới dạng cookie HttpOnly).
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const logout = () => {
    // ⚡ Không cần gửi body — backend tự đọc refreshToken từ cookie để
    // thu hồi, rồi xóa cookie ở trình duyệt qua Set-Cookie response.
    api.post('/auth/logout').catch(() => {});

    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được sử dụng trong AuthProvider');
  return context;
};