"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PAYMENT_STATUS_LABEL } from '@/lib/orderLabels';

// ⚡ Nhóm G Đợt C: badge vuông đen-trắng/đỏ theo chuẩn Storefront, dùng
// PAYMENT_STATUS_LABEL dùng chung (frontend/src/lib/orderLabels.ts) — trước
// đây hiện thẳng mã status thô (PENDING/PAID) không dịch, không đồng bộ với
// nhãn tiếng Việt đã có sẵn ở admin/orders/page.tsx.
function getPaymentStatusBadge(status: string): string {
  if (status === 'PAID') return 'bg-black text-white';
  if (status === 'CANCELLED' || status === 'FAILED') return 'bg-red-600 text-white';
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      try {
        const res = await api.get('/orders/my-orders');
        const rawData = res.data?.data || res.data;

        // Ép kiểu an toàn, bắt buộc orders phải là mảng
        setOrders(Array.isArray(rawData) ? rawData : []);
      } catch (err: any) {
        console.error("Lỗi lấy lịch sử đơn hàng:", err);
        setOrders([]);
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white text-[#111]">
        <span className="tracking-[0.3em] text-xs uppercase font-bold antialiased animate-pulse">ĐANG TẢI LỊCH SỬ ĐƠN HÀNG...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] text-[#111]">Lịch sử đơn hàng</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-none p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">Bạn chưa có đơn hàng nào.</p>
            <Link href="/" className="bg-black text-white px-8 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-none p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mã đơn: #{order.orderCode || order.id?.slice(0, 8)}</p>
                  <span className={`text-[10px] px-3 py-1.5 rounded-none uppercase font-black tracking-widest ${getPaymentStatusBadge(order.paymentStatus)}`}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.orderItems?.map((item: any) => {
                    const productImg = item.product?.images?.[0] || item.product?.image;

                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#f4f4f4] rounded-none overflow-hidden flex-shrink-0 border border-gray-200/80 flex items-center justify-center">
                            {productImg ? (
                              <img src={productImg} alt={item.product?.title || 'Sản phẩm'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black">QUOCÉ</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                            <p className="text-[11px] text-gray-400">Số lượng: {item.quantity || 1}</p>
                          </div>
                        </div>

                        <p className="text-xs font-black text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.priceAtPurchase) * (item.quantity || 1))}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between font-black text-gray-900 text-xs uppercase tracking-wide">
                  <span>Tổng tiền</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.totalAmount))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
