"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ENV } from '@/config/env';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';

// ⚡ Nhóm G Đợt 2 (Phần A3): chỉ báo độ mạnh mật khẩu CƠ BẢN — không tách
// file riêng, chỉ dùng trong trang này.
function getPasswordStrength(pw: string): { label: string; color: string; score: number } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Yếu', color: 'bg-red-500', score };
  if (score <= 3) return { label: 'Trung bình', color: 'bg-amber-500', score };
  return { label: 'Mạnh', color: 'bg-green-500', score };
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const strength = getPasswordStrength(password);

  // ⚡ Đúng khuôn với login/page.tsx — cùng shape response, cùng hành vi
  // sau khi xác thực thành công (build userData, login(), redirect).
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      // 🛡️ FIX: đổi từ fetch() thô sang axios instance `api` (đúng base URL
      // + withCredentials tự động) — trước đây dùng fetch() tay, không có
      // cookie, không nhất quán với phần còn lại của app.
      const response = await api.post('/auth/register', { fullName, email, password });

      // ⚡ FIX: POST /auth/register backend ĐÃ set cookie HttpOnly y hệt
      // /auth/login (setAuthCookies() dùng chung) — auto-login luôn, không
      // còn bắt người dùng quay lại /login đăng nhập thủ công như trước.
      handleAuthSuccess(response.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">Tạo tài khoản mới</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold uppercase tracking-wider text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Họ và tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Email</label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
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
            {password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-none ${i < Math.ceil((strength.score / 5) * 3) ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 pr-11 rounded-none focus:outline-none focus:border-black transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
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
                text="signup_with"
              />
            </div>
          </GoogleOAuthProvider>
        )}

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-black hover:underline">
              Đăng nhập
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
