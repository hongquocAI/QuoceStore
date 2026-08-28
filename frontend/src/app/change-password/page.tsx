"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
      baseUrl = baseUrl.replace(/\/api\/v1$/, '').replace(/\/api$/, '');

      const res = await fetch(`${baseUrl}/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('Đổi mật khẩu thành công!');
        setIsSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(result.message || 'Đổi mật khẩu thất bại.');
        setIsSuccess(false);
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setMessage('Không thể kết nối đến máy chủ.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-28 text-center">
        <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đổi mật khẩu.</p>
        <Link href="/login" className="bg-gray-900 text-white px-6 py-3 text-xs uppercase tracking-widest">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16 min-h-screen">
      <h1 className="text-3xl font-serif text-gray-900 mb-8 border-b pb-4">Đổi mật khẩu</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 border border-gray-200 rounded shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
          <input 
            type="password" 
            placeholder="Nhập mật khẩu hiện tại"
            value={oldPassword} 
            onChange={(e) => setOldPassword(e.target.value)} 
            className="w-full border border-gray-200 p-3 text-sm rounded focus:outline-black" 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">Mật khẩu mới</label>
          <input 
            type="password" 
            placeholder="Nhập mật khẩu mới"
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            className="w-full border border-gray-200 p-3 text-sm rounded focus:outline-black" 
            required 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">Xác nhận mật khẩu mới</label>
          <input 
            type="password" 
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            className="w-full border border-gray-200 p-3 text-sm rounded focus:outline-black" 
            required 
          />
        </div>

        {message && (
          <p className={`text-xs font-medium ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 text-xs uppercase tracking-widest font-medium hover:bg-black transition-colors rounded shadow"
        >
          {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
