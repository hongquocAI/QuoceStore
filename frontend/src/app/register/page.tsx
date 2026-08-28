"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        router.push('/login');
      } else {
        setError(result.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-28 min-h-screen flex flex-col justify-center">
      <h1 className="text-3xl font-serif text-center mb-8">Đăng ký tài khoản</h1>
      {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}
      
      <form onSubmit={handleRegister} className="space-y-4">
        <input 
          type="text" 
          placeholder="Họ và tên" 
          className="w-full border border-gray-200 p-3 text-sm focus:outline-black"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full border border-gray-200 p-3 text-sm focus:outline-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Mật khẩu (ít nhất 6 ký tự)" 
          className="w-full border border-gray-200 p-3 text-sm focus:outline-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-gray-900 text-white py-3 text-sm uppercase tracking-widest hover:bg-black">
          Đăng ký
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-6">
        Đã có tài khoản? <Link href="/login" className="text-black font-medium underline">Đăng nhập</Link>
      </p>
    </div>
  );
}