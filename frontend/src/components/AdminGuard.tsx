"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Nếu load xong và không phải admin thì đá về trang chủ
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) return <div className="p-10 text-center">Đang kiểm tra quyền truy cập...</div>;
  if (!user || user.role !== 'ADMIN') return null;

  return <>{children}</>;
}