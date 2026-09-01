import Link from 'next/link';

// ⚡ Nhóm D (2026-09-02): dự án chưa từng có Footer — 3 trang pháp lý mới
// (/privacy-policy, /terms, /return-policy) sẽ bị orphan (không ai bấm vào
// được) nếu không có điều hướng, đúng lỗi đã sửa trước đây với
// /orders/lookup, /change-password. Thêm luôn link /orders/lookup ở đây để
// LUÔN thấy được bất kể trạng thái đăng nhập (Header chỉ hiện link đó khi
// CHƯA đăng nhập, ở nav chính).
export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.2em] text-[#111]">
          QUOCÉ.
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <Link href="/orders/lookup" className="hover:text-black transition">Tra cứu đơn hàng</Link>
          <Link href="/return-policy" className="hover:text-black transition">Chính sách đổi trả</Link>
          <Link href="/terms" className="hover:text-black transition">Điều khoản dịch vụ</Link>
          <Link href="/privacy-policy" className="hover:text-black transition">Chính sách bảo mật</Link>
        </nav>

        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          © 2026 QUOCÉ — Dự án demo/portfolio
        </p>
      </div>
    </footer>
  );
}
