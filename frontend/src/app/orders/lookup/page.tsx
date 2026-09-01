"use client";
import { useState } from 'react';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';

// ⚡ Nhóm G Đợt B: badge trạng thái vuông đen-trắng/đỏ theo chuẩn Storefront
// (thay cho tông emerald/gray bo góc của hướng "gia đình Account" đã bỏ).
function getPaymentStatusBadge(status: string): string {
  if (status === 'PAID') return 'bg-black text-white';
  if (status === 'CANCELLED' || status === 'FAILED') return 'bg-red-600 text-white';
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}

export default function OrderLookupPage() {
  const [orderCode, setOrderCode] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [order, setOrder] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOrder(null);

    if (!/^0\d{9}$/.test(customerPhone)) {
      setErrorMessage('Số điện thoại phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 0).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/orders/lookup', {
        orderCode: Number(orderCode),
        customerPhone,
      });
      setOrder(res.data.data);
    } catch (err: any) {
      setErrorMessage(
        err.response?.status === 429
          ? 'Bạn đã thử quá nhiều lần, vui lòng đợi ít phút rồi thử lại.'
          : getApiErrorMessage(err, 'Không tìm thấy đơn hàng khớp với thông tin đã nhập.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">

      <div className="pt-16 pb-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">
          Tra cứu đơn hàng
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-3">
          Dành cho khách đặt hàng không cần tài khoản
        </p>
      </div>

      <div className="max-w-md mx-auto px-6">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-none p-6 space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
              Mã đơn hàng
            </label>
            <input
              type="number"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="VD: 2"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
              Số điện thoại đã dùng khi đặt hàng
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0912345678"
              className="w-full bg-white border border-gray-300 text-black text-xs font-medium px-4 py-3.5 rounded-none focus:outline-none focus:border-black transition"
            />
          </div>

          {errorMessage && (
            <p className="p-3 text-[11px] font-bold uppercase tracking-wider text-center whitespace-pre-line rounded-none border bg-red-50 border-red-200 text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'ĐANG TRA CỨU...' : 'TRA CỨU'}
          </button>
        </form>

        {order && (
          <div className="mt-8 bg-white border border-gray-200 rounded-none p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Mã đơn #{order.orderCode}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none ${getPaymentStatusBadge(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>

            <div className="space-y-2">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-none">
                  <div>
                    <p className="font-bold text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                    {item.variantColorName && (
                      <p className="text-gray-400 text-[11px] mt-0.5">Màu: {item.variantColorName}</p>
                    )}
                    <p className="text-gray-400 text-[11px]">SL: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      Number(item.priceAtPurchase) * item.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-black text-sm text-gray-900 uppercase tracking-wide">
              <span>Tổng tiền</span>
              <span>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  Number(order.totalAmount),
                )}
              </span>
            </div>

            <div className="border border-gray-200 rounded-none p-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase tracking-wide">Trạng thái giao hàng</span>
                <span className="font-bold text-gray-900">{order.shippingStatus}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 font-bold uppercase tracking-wide flex-shrink-0">Địa chỉ</span>
                <span className="font-bold text-gray-900 text-right">{order.address}</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
