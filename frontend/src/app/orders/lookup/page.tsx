"use client";
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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
          : err.response?.data?.message || 'Không tìm thấy đơn hàng khớp với thông tin đã nhập.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-32">
      <div className="pt-16 pb-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide uppercase mb-4 text-[#111]">
          Tra cứu đơn hàng
        </h1>
        <p className="text-xs md:text-sm text-gray-600 font-bold uppercase tracking-wider">
          Dành cho khách đặt hàng không cần tài khoản
        </p>
      </div>

      <div className="max-w-md mx-auto px-6">
        <form onSubmit={handleSubmit} className="border-2 border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">
              Mã đơn hàng
            </label>
            <input
              type="number"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="VD: 2"
              className="w-full border border-gray-300 px-4 py-3.5 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">
              Số điện thoại đã dùng khi đặt hàng
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0912345678"
              className="w-full border border-gray-300 px-4 py-3.5 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {errorMessage && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 uppercase tracking-wide">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </form>

        {order && (
          <div className="mt-8 border-2 border-black p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Mã đơn #{order.orderCode}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1">
                {order.paymentStatus}
              </span>
            </div>

            <div className="space-y-2">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-50 last:border-none">
                  <div>
                    <p className="font-bold text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                    {item.variantColorName && (
                      <p className="text-gray-400">Màu: {item.variantColorName}</p>
                    )}
                    <p className="text-gray-400">SL: {item.quantity}</p>
                  </div>
                  <span className="font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      Number(item.priceAtPurchase) * item.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-bold text-sm">
              <span>Tổng tiền</span>
              <span>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  Number(order.totalAmount),
                )}
              </span>
            </div>

            <div className="text-xs text-gray-500 space-y-1 pt-2">
              <p>Trạng thái giao hàng: <span className="font-bold text-gray-900">{order.shippingStatus}</span></p>
              <p>Địa chỉ: {order.address}</p>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}