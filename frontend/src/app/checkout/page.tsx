"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, getCartLineId } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type PaymentMethod = 'COD' | 'BANK_TRANSFER';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Trạng thái sau khi đặt hàng thành công
  const [orderResult, setOrderResult] = useState<any>(null);
  const [qrData, setQrData] = useState<{ qrCode: string; checkoutUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }
    if (!/^0\d{9}$/.test(customerPhone)) {
      setErrorMessage('Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 0).');
      return;
    }

    setLoading(true);
    try {
      // ⚡ Gửi kèm variantId cho từng dòng giỏ hàng (đúng fix Cart Module) —
      // server sẽ tự tính lại giá + trừ tồn kho theo đúng biến thể đã chọn,
      // KHÔNG gửi price/totalAmount (server luôn tự tính lại, không tin client).
      const payload = {
        userId: user?.id, // undefined nếu khách chưa đăng nhập -> backend tự xử lý Guest checkout
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        address,
        paymentMethod,
        cart: cart.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const res = await api.post('/orders', payload);
      const order = res.data.data;
      setOrderResult(order);
      clearCart();

      // Nếu chọn chuyển khoản VietQR, tạo QR ngay sau khi đơn hàng được tạo
      if (paymentMethod === 'BANK_TRANSFER') {
        setQrLoading(true);
        try {
          const qrRes = await api.post('/payments/create-qr', {
            orderId: order.id,
            description: `Thanh toan don ${order.orderCode}`,
          });
          setQrData({
            qrCode: qrRes.data.data.qrCode,
            checkoutUrl: qrRes.data.data.checkoutUrl,
          });
        } catch (qrErr: any) {
          setErrorMessage(
            'Đơn hàng đã được tạo, nhưng không thể khởi tạo mã QR thanh toán lúc này. ' +
              'Vui lòng liên hệ hỗ trợ hoặc thử lại sau.',
          );
        } finally {
          setQrLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Màn hình xác nhận sau khi đặt hàng thành công ──────────────────
  if (orderResult) {
    return (
      <div className="min-h-screen bg-[#fafafc] pt-16 pb-28 px-6">
        <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-3xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-emerald-600 text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-serif text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Mã đơn hàng: <span className="font-semibold text-gray-900">#{orderResult.orderCode}</span>
          </p>

          <div className="text-left bg-[#fafafc] rounded-2xl p-5 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền</span>
              <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  Number(orderResult.totalAmount),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phương thức</span>
              <span className="font-medium text-gray-900">
                {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản VietQR'}
              </span>
            </div>
          </div>

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="mb-6">
              {qrLoading && <p className="text-sm text-gray-500">Đang tạo mã QR thanh toán...</p>}
              {qrData && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-gray-600">Quét mã để thanh toán qua ứng dụng ngân hàng</p>
                  <img src={qrData.qrCode} alt="VietQR" className="w-56 h-56 object-contain border-2 border-emerald-500 rounded-xl p-2" />
                  <a
                    href={qrData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 underline"
                  >
                    Hoặc mở link thanh toán
                  </a>
                  <p className="text-xs text-gray-400">Trạng thái đơn hàng sẽ tự động cập nhật sau khi thanh toán.</p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-red-500 mb-4">{errorMessage}</p>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="bg-black text-white py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-800 transition"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link href="/" className="text-xs text-gray-500 hover:text-black transition">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Giỏ hàng trống, chưa từng đặt ──────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500 text-sm">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="bg-black text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-gray-800 transition">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  // ── Form thanh toán ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafafc] pt-10 pb-28">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cột trái: Form thông tin */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b border-gray-100 pb-3">
                Thông tin giao hàng
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-gray-200 px-4 py-3 text-sm rounded-2xl focus:outline-black bg-[#fafafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full border border-gray-200 px-4 py-3 text-sm rounded-2xl focus:outline-black bg-[#fafafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email (không bắt buộc)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@quoce.vn"
                  className="w-full border border-gray-200 px-4 py-3 text-sm rounded-2xl focus:outline-black bg-[#fafafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                  className="w-full border border-gray-200 px-4 py-3 text-sm rounded-2xl focus:outline-black bg-[#fafafc]"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b border-gray-100 pb-3 mb-1">
                Phương thức thanh toán
              </h2>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition flex items-center justify-between ${
                  paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                {paymentMethod === 'COD' && <span className="text-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition flex items-center justify-between ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">Chuyển khoản VietQR</span>
                {paymentMethod === 'BANK_TRANSFER' && <span className="text-black">✓</span>}
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-2xl uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </form>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-6">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b border-gray-100 pb-3 mb-4">
                Đơn hàng của bạn ({cart.reduce((a, c) => a + c.quantity, 0)} sản phẩm)
              </h2>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {cart.map((item) => {
                  const lineId = getCartLineId(item.id, item.variantId);
                  return (
                    <div key={lineId} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-none">
                      <div className="w-14 h-14 bg-[#f0f0f2] rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-gray-400 uppercase">QUOCÉ</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                        {item.variantColorName && (
                          <p className="text-[11px] text-gray-400">Màu: {item.variantColorName}</p>
                        )}
                        <p className="text-[11px] text-gray-400">SL: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between font-semibold text-gray-900">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                * Tổng tiền cuối cùng sẽ được hệ thống xác nhận lại sau khi đặt hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
