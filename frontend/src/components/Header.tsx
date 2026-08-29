"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext'; // ⚡ Sử dụng AuthContext để lấy thông tin role chính xác[cite: 17, 18]

export default function Header() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 font-sans">
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO THƯƠNG HIỆU */}
        <Link href="/" className="text-xl font-black uppercase tracking-[0.2em] text-[#111] antialiased">
          QUOCÉ.
        </Link>

        {/* MENU ĐIỀU HƯỚNG */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#111] antialiased">
          <Link href="/" className="hover:text-gray-500 transition">Cửa hàng</Link>
          <Link href="/accessories" className="hover:text-gray-500 transition">Phụ kiện</Link>
        </nav>

        {/* GIỎ HÀNG & TÀI KHOẢN */}
        <div className="flex items-center gap-6">
          
          <Link href="/cart" className="text-xs font-bold uppercase tracking-wider text-[#111] hover:text-gray-500 transition flex items-center gap-1.5 antialiased">
            <span>Giỏ hàng</span>
            <span className="bg-black text-white text-[10px] w-5 h-5 rounded-none flex items-center justify-center font-black">
              {totalItems}
            </span>
          </Link>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-none hover:bg-gray-800 transition flex items-center gap-3 antialiased shadow-sm"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-6 h-6 object-cover rounded-none border border-white/40" />
                ) : (
                  <span className="w-6 h-6 bg-white text-black font-black flex items-center justify-center text-[10px] rounded-none">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                <span className="max-w-[140px] truncate">{user.fullName || "Tài khoản"}</span>
                <span className="text-[10px]">▼</span>
              </button>

              {/* Menu thả xuống phân quyền động */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-none py-2 z-50 text-xs font-bold uppercase tracking-wider antialiased">
                  <div className="px-4 py-2 text-gray-400 text-[10px] border-b border-gray-100 truncate">
                    {user.email}
                  </div>

                  {/* ⚡ ĐIỀU KIỆN PHÂN QUYỀN: Chỉ hiển thị mục Quản lý sản phẩm nếu user là ADMIN[cite: 17] */}
                  {user.role === 'ADMIN' && (
                    <>
                      <Link
                        href="/admin/products"
                        className="block px-4 py-3 bg-gray-50 text-black font-black hover:bg-black hover:text-white transition border-b border-gray-200"
                        onClick={() => setDropdownOpen(false)}
                      >
                        ⚡ Quản trị hệ thống (Admin)
                      </Link>
                      {/* ⚡ Nhóm F: trang quản lý đơn hàng Admin mới */}
                      <Link
                        href="/admin/orders"
                        className="block px-4 py-3 bg-gray-50 text-black font-black hover:bg-black hover:text-white transition border-b border-gray-200"
                        onClick={() => setDropdownOpen(false)}
                      >
                        📦 Quản lý đơn hàng
                      </Link>
                    </>
                  )}

                  <Link 
                    href="/profile" 
                    className="block px-4 py-2.5 text-gray-800 hover:bg-gray-100 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <Link 
                    href="/orders" 
                    className="block px-4 py-2.5 text-gray-800 hover:bg-gray-100 transition"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Đơn hàng của tôi
                  </Link>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition border-t border-gray-100 mt-1"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-none hover:bg-gray-800 transition antialiased shadow-sm"
            >
              Đăng nhập
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}