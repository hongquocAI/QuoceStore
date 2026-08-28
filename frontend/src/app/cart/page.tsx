"use client";
import { useState } from 'react';
import { useCart, getCartLineId } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  // State cho mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0); // Lưu phần trăm giảm (VD: 0.1 cho 10%)
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCodeName, setAppliedCodeName] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = subtotal * discount;
  const finalTotal = subtotal - discountAmount;

  // Hàm kiểm tra mã giảm giá với Backend
const handleApplyCoupon = async () => {
  if (!couponCode.trim()) return;
  setCouponMessage('Đang kiểm tra mã...');

  try {
    const res = await api.get(`/discounts/code/${couponCode.trim().toUpperCase()}`);
    const discountObj = res.data.data || res.data;

    if (discountObj && discountObj.isActive) {
      setDiscount(Number(discountObj.percentage));
      setAppliedCodeName(discountObj.code);
      setCouponMessage(`Đã áp dụng mã thành công (-${Number(discountObj.percentage) * 100}%)`);
    } else {
      setCouponMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      setDiscount(0);
    }
  } catch (err) {
    // ⚡ KHÔNG còn fallback giả lập — lỗi thật thì báo lỗi thật.
    setCouponMessage('Mã giảm giá không tồn tại hoặc có lỗi kết nối, vui lòng thử lại.');
    setDiscount(0);
  }
};

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center space-y-4 px-6">
        <p className="text-gray-500 font-light text-sm tracking-wide">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-lg shadow-black/10">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-gray-900 pb-28 pt-10">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-serif mb-10 tracking-tight">Giỏ hàng của bạn</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Cột trái: Danh sách sản phẩm trong giỏ */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b border-gray-100 pb-3">
                Chi tiết sản phẩm ({cart.reduce((a, c) => a + c.quantity, 0)} sản phẩm)
              </h2>

              {cart.map((item) => {
                const lineId = getCartLineId(item.id, item.variantId);
                return (
                  <div key={lineId} className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-gray-50 last:border-none">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-20 bg-[#f0f0f2] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest">QUOCÉ</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif text-sm text-gray-900 mb-1">{item.title}</h3>
                        {/* ⚡ MỚI: hiển thị màu đã chọn, nếu có */}
                        {item.variantColorName && (
                          <p className="text-[11px] text-gray-400 font-medium mb-1">Màu: {item.variantColorName}</p>
                        )}
                        <p className="text-xs text-gray-500 font-medium">
                          Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <div className="flex items-center space-x-2 bg-[#fafafc] border border-gray-200 rounded-full p-1">
                        <button
                          onClick={() => updateQuantity(lineId, item.quantity - 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-700 hover:bg-white font-bold transition text-xs shadow-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(lineId, item.quantity + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-700 hover:bg-white font-bold transition text-xs shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-semibold text-sm text-gray-900 min-w-[100px]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeFromCart(lineId)}
                        className="text-gray-400 hover:text-red-500 transition text-xs uppercase tracking-wider font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Cột phải: Nhập mã giảm giá & Tổng quan đơn hàng */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Box Mã giảm giá */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-700">Mã giảm giá</h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nhập mã (VD: QUOCE10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 border border-gray-200 px-4 py-3 text-xs rounded-2xl focus:outline-black bg-[#fafafc] uppercase font-mono"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-gray-900 text-white px-5 py-3 rounded-2xl text-xs uppercase tracking-wider font-medium hover:bg-black transition"
                >
                  Áp dụng
                </button>
              </div>
              {couponMessage && (
                <p className={`text-xs font-medium p-2.5 rounded-xl ${discount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Box Tổng quan */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
              <h2 className="text-lg font-serif border-b border-gray-100 pb-4">Tổng quan đơn hàng</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá ({appliedCodeName})</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-emerald-600">Miễn phí</span>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-semibold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  sessionStorage.setItem('appliedDiscount', String(discount));
                  sessionStorage.setItem('finalTotal', String(finalTotal));
                  router.push('/checkout');
                }}
                className="w-full bg-black text-white py-4 rounded-2xl uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gray-800 transition shadow-lg shadow-black/10 text-center block"
              >
                Tiến hành thanh toán
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
