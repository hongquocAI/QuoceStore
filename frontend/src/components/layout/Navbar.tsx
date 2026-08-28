"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { cart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Kiểm tra token trong localStorage khi component được mount ở phía client
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 font-sans">
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO THƯƠNG HIỆU */}
        <Link href="/" className="text-xl font-black uppercase tracking-[0.2em] text-[#111]">
          QUOCÉ.
        </Link>

        {/* MENU ĐIỀU HƯỚNG TRUNG TÂM */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#111]">
          <Link href="/" className="hover:text-gray-500 transition">Cửa hàng</Link>
          <Link href="/#categories" className="hover:text-gray-500 transition">Phụ kiện</Link>
        </nav>

        {/* KHU VỰC GIỎ HÀNG & TÀI KHOẢN */}
        <div className="flex items-center gap-6">
          
          {/* Giỏ hàng */}
          <Link href="/cart" className="text-xs font-bold uppercase tracking-wider text-[#111] hover:text-gray-500 transition flex items-center gap-1.5">
            <span>Giỏ hàng</span>
            <span className="bg-black text-white text-[10px] w-5 h-5 rounded-none flex items-center justify-center font-black">
              {totalItems}
            </span>
          </Link>

          {/* TRẠNG THÁI ĐĂNG NHẬP / TÀI KHOẢN */}
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-black text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-none hover:bg-gray-800 transition flex items-center gap-2"
              >
                <span>Tài khoản</span>
                <span className="text-[10px]">▼</span>
              </button>

              {/* Menu thả xuống khi đã đăng nhập */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-none py-2 z-50 text-xs font-bold uppercase tracking-wider">
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
                    onClick={handleLogout}
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
              className="bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-none hover:bg-gray-800 transition"
            >
              Đăng nhập
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}