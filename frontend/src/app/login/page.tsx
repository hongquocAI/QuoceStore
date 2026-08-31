"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ENV } from '@/config/env';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // ⚡ Nhóm G Đợt 2 (Phần B): chung 1 hàm xử lý kết quả xác thực thành công
  // (dùng cho cả submit form thường LẪN Google) — cùng shape response từ
  // backend (auth.controller.ts luôn strip token, chỉ trả hồ sơ).
  const handleAuthSuccess = (resultData: any) => {
    const userData = {
      id: resultData.id,
      email: resultData.email,
      fullName: resultData.fullName,
      role: resultData.role,
      avatarUrl: resultData.avatarUrl,
    };

    login(userData);

    if (userData.role === 'ADMIN') {
      router.push('/admin/products');
    } else {
      router.push('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      // ⚡ FIX: response.data.data giờ KHÔNG còn accessToken/refreshToken nữa
      // (đã chuyển hẳn sang cookie HttpOnly, Backend tự set qua Set-Cookie).
      handleAuthSuccess(response.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Nhóm G Đợt 2 (Phần B): Google trả về "credential" (JWT ID token) —
  // gửi thẳng lên backend làm `token`, backend tự verify chữ ký + tra
  // audience (xem auth.service.ts googleLogin()).
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { token: credentialResponse.credential });
      handleAuthSuccess(response.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111] flex flex-col justify-center items-center px-6 font-sans antialiased">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-none shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-[#111]">QUOCÉ.</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">Đăng nhập tài khoản hệ thống</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Email đăng nhập</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@quoce.vn"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 pr-11 rounded-none focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        {ENV.googleClientId && (
          <GoogleOAuthProvider clientId={ENV.googleClientId} locale="vi">
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hoặc</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMessage('Đăng nhập Google thất bại.')}
                theme="outline"
                size="large"
                width="336"
                text="signin_with"
              />
            </div>
          </GoogleOAuthProvider>
        )}

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-black hover:underline">
              Đăng ký ngay
            </Link>
          </p>
          <Link href="/" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
            ← Quay lại trang chủ cửa hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
