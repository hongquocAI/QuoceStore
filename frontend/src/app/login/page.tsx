"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      // ⚡ FIX: response.data.data giờ KHÔNG còn accessToken/refreshToken nữa
      // (đã chuyển hẳn sang cookie HttpOnly, Backend tự set qua Set-Cookie).
      const resultData = response.data.data;

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
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
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
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-800 transition shadow-md"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
            ← Quay lại trang chủ cửa hàng
          </Link>
        </div>
      </div>
    </div>
  );
}