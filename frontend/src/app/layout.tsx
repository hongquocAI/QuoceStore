import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import AiChatWidget from "@/components/AiChatWidget";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {/* ⚡ Đổi bg-white thành bg-[#f5f5f7] để khớp chuẩn Apple Store Background */}
            <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
              <Header />
              <main className="flex-1">{children}</main>
              
              <AiChatWidget />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}