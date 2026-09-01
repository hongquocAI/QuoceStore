"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;

    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 🛡️ FIX (Nhóm G Đợt 3): trước đây dùng fetch() thô, có 2 bug — (1)
      // không kèm credentials nên không gửi cookie HttpOnly, backend không
      // xác thực được; (2) tự cắt hậu tố /api/v1|/api khỏi
      // NEXT_PUBLIC_API_URL trong khi baseURL thật không có hậu tố đó, có
      // thể bắn sai endpoint. Đổi sang `api` instance (đã có baseURL đúng +
      // withCredentials: true sẵn) sửa dứt điểm cả 2 bug cùng lúc.
      await api.patch(`/users/${user.id}/password`, { oldPassword, newPassword });

      setMessage('Đổi mật khẩu thành công!');
      setIsSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, 'Đổi mật khẩu thất bại.'));
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Vui lòng đăng nhập để đổi mật khẩu.</p>
        <Link href="/login" className="bg-black text-white px-8 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">

      <div className="max-w-md mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Đổi mật khẩu
        </h1>
      </div>

      <div className="max-w-md mx-auto px-6 pt-8">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-none p-8 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Mật khẩu hiện tại</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
              required
            />
          </div>

          {message && (
            <p className={`text-[11px] font-bold uppercase tracking-wider whitespace-pre-line ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐỔI MẬT KHẨU'}
          </button>
        </form>
      </div>
    </div>
  );
}
