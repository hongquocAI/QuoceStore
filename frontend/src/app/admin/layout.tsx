"use client";
import AdminGuard from '@/components/AdminGuard';

// ⚡ Nhóm G Đợt 1: layout lồng theo segment /admin/* — tự động bọc MỌI
// route con hiện tại (orders, products) LẪN tương lai bằng AdminGuard,
// không cần nhớ tự thêm guard mỗi khi tạo trang Admin mới. Trước đây
// admin/orders/page.tsx và admin/products/page.tsx tự viết lặp lại 1:1
// logic check role — đã xóa, dồn về đúng 1 nguồn duy nhất ở đây.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
