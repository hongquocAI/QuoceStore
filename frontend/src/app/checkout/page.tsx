"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, getCartLineId } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

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

  // ⚡ Nhóm F: mã giảm giá mang từ trang giỏ hàng sang qua sessionStorage
  // (key `discountCode`, xem cart/page.tsx). Server LUÔN là nguồn sự thật
  // cuối cùng — % hiển thị ở đây chỉ để khách xem trước, không được dùng để
  // tính số tiền gửi lên server (server tự tính lại toàn bộ trong transaction).
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountNote, setDiscountNote] = useState('');

  useEffect(() => {
    const savedCode = sessionStorage.getItem('discountCode');
    if (!savedCode) return;

    // Re-validate lại ngay khi vào trang checkout — mã có thể đã hết hạn
    // hoặc hết lượt trong lúc khách còn đang điền form ở trang giỏ hàng.
    // Không tin lại % đã tính từ trang giỏ hàng.
    api
      .get(`/discounts/code/${savedCode}`)
      .then((res) => {
        const discountObj = res.data.data || res.data;
        if (discountObj?.isActive) {
          setDiscountCode(discountObj.code);
          setDiscountPercentage(Number(discountObj.percentage));
        } else {
          sessionStorage.removeItem('discountCode');
          setDiscountNote('Mã giảm giá không còn hiệu lực, đơn hàng sẽ tính theo giá gốc.');
        }
      })
      .catch(() => {
        // Mã không tồn tại/hết hạn/hết lượt -> KHÔNG chặn thanh toán, chỉ
        // báo nhẹ và tiếp tục với giá gốc (đúng hành vi server sẽ áp dụng
        // nếu lỡ vẫn gửi mã: BadRequestException nếu mã sai, nhưng ở đây ta
        // chủ động bỏ mã trước để tránh khách bị chặn đặt hàng vô lý).
        sessionStorage.removeItem('discountCode');
        setDiscountNote('Mã giảm giá không còn hiệu lực, đơn hàng sẽ tính theo giá gốc.');
      });
  }, []);

  const discountAmountPreview = Math.round(subtotal * discountPercentage);
  const totalPreview = subtotal - discountAmountPreview;

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
        // ⚡ Nhóm F: chỉ gửi MÃ, không gửi percentage/số tiền đã giảm — server
        // tự validate lại mã và tự tính số tiền giảm trong OrdersService.
        ...(discountCode && { discountCode }),
      };

      const res = await api.post('/orders', payload);
      const order = res.data.data;
      setOrderResult(order);
      clearCart();
      sessionStorage.removeItem('discountCode');

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
      setErrorMessage(getApiErrorMessage(err, 'Có lỗi xảy ra khi đặt hàng, vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Màn hình xác nhận sau khi đặt hàng thành công ──────────────────
  if (orderResult) {
    return (
      <div className="min-h-screen bg-white text-[#111] font-sans antialiased pt-16 pb-28 px-6">
        <div className="max-w-xl mx-auto bg-white border-2 border-black rounded-none p-8 text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-black">✓</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
            Mã đơn hàng: <span className="text-gray-900">#{orderResult.orderCode}</span>
          </p>

          <div className="text-left border border-gray-200 rounded-none p-5 mb-6 space-y-2 text-xs">
            {/* ⚡ Nhóm F: dùng orderResult.discountAmount TỪ SERVER — nguồn
                sự thật cuối cùng, không phải giá trị preview tính ở client. */}
            {Number(orderResult.discountAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase font-bold tracking-wide">Giảm giá {orderResult.discountCode ? `(${orderResult.discountCode})` : ''}</span>
                <span className="font-bold text-emerald-600">
                  -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    Number(orderResult.discountAmount),
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase font-bold tracking-wide">Tổng tiền</span>
              <span className="font-black text-gray-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  Number(orderResult.totalAmount),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase font-bold tracking-wide">Phương thức</span>
              <span className="font-bold text-gray-900">
                {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản VietQR'}
              </span>
            </div>
          </div>

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className="mb-6">
              {qrLoading && <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Đang tạo mã QR thanh toán...</p>}
              {qrData && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs font-medium text-gray-600">Quét mã để thanh toán qua ứng dụng ngân hàng</p>
                  {/* 🛡️ FIX (lỗi có từ commit đầu tiên, không phải regression
                      Đợt C): `qrData.qrCode` là CHUỖI DỮ LIỆU VietQR thô theo
                      chuẩn EMVCo (xem @payos/node payment-requests.d.ts:93 —
                      `qrCode: string`), KHÔNG PHẢI URL ảnh. Gán trực tiếp vào
                      <img src> luôn vỡ ảnh vì đó không phải đường dẫn ảnh.
                      Phải tự render chuỗi này thành ảnh QR ở phía client bằng
                      thư viện qrcode.react (API đã đọc trực tiếp .d.ts, không
                      đoán) — đúng cách PayOS Checkout page (link dự phòng)
                      đang tự làm. */}
                  <div className="border-2 border-black rounded-none p-3 bg-white">
                    <QRCodeSVG value={qrData.qrCode} size={224} level="M" />
                  </div>
                  <a
                    href={qrData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold uppercase tracking-wider text-black underline"
                  >
                    Hoặc mở link thanh toán
                  </a>
                  <p className="text-[11px] text-gray-400">Trạng thái đơn hàng sẽ tự động cập nhật sau khi thanh toán.</p>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-600 mb-4">{errorMessage}</p>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="bg-black text-white py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition"
            >
              Xem đơn hàng của tôi
            </Link>
            <Link href="/" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="bg-black text-white px-8 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  // ── Form thanh toán ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">Thanh toán</h1>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cột trái: Form thông tin */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-none p-6 space-y-4">
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100 pb-3">
                Thông tin giao hàng
              </h2>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-white border border-gray-300 px-4 py-3.5 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full bg-white border border-gray-300 px-4 py-3.5 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Email (không bắt buộc)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@quoce.vn"
                  className="w-full bg-white border border-gray-300 px-4 py-3.5 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                  className="w-full bg-white border border-gray-300 px-4 py-3.5 text-xs font-medium rounded-none focus:outline-none focus:border-black transition"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-none p-6 space-y-3">
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100 pb-3 mb-1">
                Phương thức thanh toán
              </h2>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`w-full text-left px-4 py-3.5 rounded-none border-2 transition flex items-center justify-between ${
                  paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                {paymentMethod === 'COD' && <span className="text-black font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`w-full text-left px-4 py-3.5 rounded-none border-2 transition flex items-center justify-between ${
                  paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide text-gray-900">Chuyển khoản VietQR</span>
                {paymentMethod === 'BANK_TRANSFER' && <span className="text-black font-black">✓</span>}
              </button>
            </div>

            {errorMessage && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 rounded-none p-3 whitespace-pre-line">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-none uppercase tracking-[0.2em] text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
            </button>
          </form>

          {/* Cột phải: Tóm tắt đơn hàng */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-none p-6 sticky top-6">
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100 pb-3 mb-4">
                Đơn hàng của bạn ({cart.reduce((a, c) => a + c.quantity, 0)} sản phẩm)
              </h2>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {cart.map((item) => {
                  const lineId = getCartLineId(item.id, item.variantId);
                  return (
                    <div key={lineId} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-none">
                      <div className="w-14 h-14 bg-[#f4f4f4] rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200/80">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-gray-400 uppercase font-black">QUOCÉ</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-900 truncate">{item.title}</p>
                        {item.variantColorName && (
                          <p className="text-[11px] text-gray-400">Màu: {item.variantColorName}</p>
                        )}
                        <p className="text-[11px] text-gray-400">SL: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-black text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between text-gray-600 text-xs font-medium">
                <span className="uppercase tracking-wide">Tạm tính</span>
                <span className="font-bold text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                </span>
              </div>

              {/* ⚡ Nhóm F: chỉ là PREVIEW cho khách xem trước — số tiền thật
                  sự áp dụng luôn do server tự tính lại khi tạo đơn. */}
              {discountCode && discountAmountPreview > 0 && (
                <div className="flex justify-between text-emerald-600 mt-2 text-xs font-medium">
                  <span className="uppercase tracking-wide">Giảm giá ({discountCode})</span>
                  <span>
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmountPreview)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-black text-gray-900 mt-2 pt-2 border-t border-gray-100 text-xs uppercase tracking-wide">
                <span>Tổng cộng</span>
                <span>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    discountCode ? totalPreview : subtotal,
                  )}
                </span>
              </div>

              {discountNote && (
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mt-2">{discountNote}</p>
              )}
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
