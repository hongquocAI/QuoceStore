"use client";
import { useState, useEffect, useRef } from 'react';
import { useCart, getCartLineId } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  // State cho mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0); // Lưu phần trăm giảm (VD: 0.1 cho 10%)
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCodeName, setAppliedCodeName] = useState('');

  // ⚡ Chọn item riêng để checkout: mặc định TẤT CẢ được chọn khi giỏ hàng
  // tải xong (kể cả lần load đầu từ localStorage), item MỚI thêm vào trong
  // lúc đang mở trang cũng tự động được chọn. Item bị xóa tự rời khỏi
  // selection vì chỉ lặp trên `currentIds` (những id còn tồn tại thật).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(cart.map((item) => getCartLineId(item.id, item.variantId)));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      currentIds.forEach((id) => {
        if (prev.has(id) || !knownIdsRef.current.has(id)) next.add(id);
      });
      return next;
    });
    knownIdsRef.current = currentIds;
  }, [cart]);

  const selectedItems = cart.filter((item) => selectedIds.has(getCartLineId(item.id, item.variantId)));
  const allSelected = cart.length > 0 && selectedIds.size === cart.length;

  const toggleSelect = (lineId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cart.map((item) => getCartLineId(item.id, item.variantId))));
    }
  };

  // ⚡ Subtotal/discount/tổng tiền tính trên ITEM ĐÃ CHỌN (không phải toàn
  // giỏ) — khớp đúng số tiền server sẽ tính khi chỉ gửi tập item đã chọn
  // lên POST /orders (xem checkout/page.tsx).
  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
  } catch (err: any) {
    // 🛡️ FIX BUG: trước đây hiển thị CỨNG 1 câu chung chung cho MỌI lỗi, dù
    // backend đã trả message rõ ràng riêng biệt cho từng ca (hết hạn/hết
    // lượt/không tồn tại) — xem DiscountsService.validateCode(). Đọc đúng
    // message thật từ response lỗi để khách biết chính xác vì sao mã không
    // dùng được, chỉ fallback về câu chung chung khi thật sự không có message
    // (VD lỗi mạng, server sập).
    setCouponMessage(
      getApiErrorMessage(err, 'Mã giảm giá không tồn tại hoặc có lỗi kết nối, vui lòng thử lại.'),
    );
    setDiscount(0);
  }
};

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="bg-black text-white px-8 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">Giỏ hàng của bạn</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Cột trái: Danh sách sản phẩm trong giỏ */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-200 rounded-none p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                  Chi tiết sản phẩm ({cart.reduce((a, c) => a + c.quantity, 0)} sản phẩm)
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Chọn tất cả</span>
                </label>
              </div>

              {cart.map((item) => {
                const lineId = getCartLineId(item.id, item.variantId);
                const isSelected = selectedIds.has(lineId);
                return (
                  <div key={lineId} className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-none transition-opacity ${isSelected ? '' : 'opacity-50'}`}>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lineId)}
                        className="w-4 h-4 accent-black cursor-pointer flex-shrink-0"
                      />
                      <div className="w-20 h-20 bg-[#f4f4f4] rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200/80">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">QUOCÉ</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold uppercase tracking-wide text-xs text-gray-900 mb-1">{item.title}</h3>
                        {/* ⚡ MỚI: hiển thị màu đã chọn, nếu có */}
                        {item.variantColorName && (
                          <p className="text-[11px] text-gray-400 font-medium mb-1">Màu: {item.variantColorName}</p>
                        )}
                        <p className="text-[11px] text-gray-500 font-medium">
                          Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      <div className="flex items-center space-x-2 border border-gray-300 rounded-none">
                        <button
                          onClick={() => updateQuantity(lineId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-black transition text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(lineId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 font-black transition text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-black text-sm text-gray-900 min-w-[100px]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeFromCart(lineId)}
                        className="text-gray-400 hover:text-red-500 transition text-[11px] uppercase tracking-wider font-bold"
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
            <div className="bg-white border border-gray-200 rounded-none p-6 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Mã giảm giá</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: QUOCE10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 px-4 py-3 text-xs font-medium rounded-none focus:outline-none focus:border-black uppercase font-mono"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-black text-white px-5 py-3 rounded-none text-[11px] uppercase tracking-wider font-bold hover:bg-gray-800 transition"
                >
                  Áp dụng
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[11px] font-bold uppercase tracking-wider p-3 rounded-none border ${discount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Box Tổng quan */}
            <div className="bg-white border-2 border-black rounded-none p-8 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-200 pb-4">Tổng quan đơn hàng</h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span className="uppercase tracking-wide">Tạm tính</span>
                  <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="uppercase tracking-wide">Giảm giá ({appliedCodeName})</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600 font-medium">
                  <span className="uppercase tracking-wide">Phí vận chuyển</span>
                  <span className="font-bold text-emerald-600 uppercase">Miễn phí</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between font-black text-gray-900 uppercase tracking-wide">
                  <span>Tổng cộng</span>
                  <span className="text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}</span>
                </div>
              </div>

              <button
                disabled={selectedItems.length === 0}
                onClick={() => {
                  // ⚡ Nhóm F: trước đây chỉ lưu % và tổng tiền đã tính sẵn ở
                  // đây — nhưng KHÔNG lưu mã code, và trang checkout không hề
                  // đọc lại 2 key này -> mã giảm giá bị rơi mất hoàn toàn
                  // trước khi tới POST /orders (server không hề biết có mã).
                  // Nay lưu thêm CHÍNH MÃ CODE để checkout gửi lên server —
                  // server sẽ tự validate + tự tính lại số tiền giảm, không
                  // tin percentage/finalTotal đã tính sẵn ở đây.
                  if (discount > 0 && appliedCodeName) {
                    sessionStorage.setItem('discountCode', appliedCodeName);
                  } else {
                    sessionStorage.removeItem('discountCode'); // tránh sót mã cũ từ lần trước
                  }
                  // ⚡ Cart chọn item riêng để checkout: truyền đúng tập
                  // lineId đã tick sang /checkout — cùng cơ chế bridge
                  // sessionStorage đã có sẵn cho discountCode.
                  sessionStorage.setItem('checkoutLineIds', JSON.stringify(Array.from(selectedIds)));
                  router.push('/checkout');
                }}
                className="w-full bg-black text-white py-4 rounded-none uppercase tracking-[0.2em] text-xs font-bold hover:bg-gray-800 transition text-center block disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Tiến hành thanh toán
              </button>
              {selectedItems.length === 0 && (
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 text-center">
                  Vui lòng chọn ít nhất 1 sản phẩm để thanh toán
                </p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
