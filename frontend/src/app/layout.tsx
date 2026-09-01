import type { Metadata } from "next";
import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AiChatWidget from "@/components/AiChatWidget";

// ⚡ Nhóm G Đợt 1: đã bỏ `next/font/google` Inter — trước đây `inter.className`
// gắn thẳng trên <body> (class-selector) che mất rule `body { font-family:
// SF Pro... }` đã khai báo sẵn trong globals.css (element-selector, luôn
// thua class-selector bất kể @layer). Kết quả là 3 font cùng tồn tại thật
// sự trên site: SF Pro (8 trang có class font-sans tường minh — Tailwind
// đã override font-sans = SF Pro trong tailwind.config.js), serif mặc định
// (chỉ heading Account, không đổi), và Inter (toàn bộ phần còn lại của
// Account — vì kế thừa thẳng từ <body>). Không trang nào chủ động muốn
// Inter — SF Pro mới là ý định thật (khai báo tường minh ở tailwind.config,
// globals.css, VÀ 8 trang). Bỏ Inter để globals.css tự thắng, dồn về đúng
// 1 nguồn font thân bài duy nhất trên toàn site.
export const metadata: Metadata = {
  title: "QUOCÉ - Phụ kiện công nghệ cao cấp",
  description: "Cửa hàng phụ kiện công nghệ chính hãng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <CartProvider>
            {/* ⚡ Đổi bg-white thành bg-[#f5f5f7] để khớp chuẩn Apple Store Background */}
            <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />

              <AiChatWidget />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}