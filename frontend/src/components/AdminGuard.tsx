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

  // ⚡ Nhóm G Đợt 1: single source of truth cho guard Admin — thay thế
  // logic lặp lại 1:1 từng có ở admin/orders/page.tsx và
  // admin/products/page.tsx (xem app/admin/layout.tsx). Style khớp
  // convention loading sẵn có của 2 trang Admin (font-sans uppercase).
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-white text-[#111] font-sans antialiased">
        <span className="tracking-[0.3em] text-xs uppercase font-bold animate-pulse">
          ĐANG KIỂM TRA QUYỀN TRUY CẬP...
        </span>
      </div>
    );
  }
  if (!user || user.role !== 'ADMIN') return null;

  return <>{children}</>;
}