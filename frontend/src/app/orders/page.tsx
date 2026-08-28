"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

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

  if (loading) return <div className="min-h-screen p-20 text-center text-gray-500">Đang tải lịch sử đơn hàng...</div>;

  return (
    <div className="min-h-screen bg-[#fafafc] pt-10 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-serif mb-8">Lịch sử đơn hàng</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào.</p>
            <Link href="/" className="bg-black text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-gray-800 transition">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Mã đơn: #{order.orderCode || order.id?.slice(0, 8)}</p>
                  <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-bold ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {order.orderItems?.map((item: any) => {
                    const productImg = item.product?.images?.[0] || item.product?.image;

                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                            {productImg ? (
                              <img src={productImg} alt={item.product?.title || 'Sản phẩm'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest font-medium">QUOCÉ</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                            <p className="text-xs text-gray-400">Số lượng: {item.quantity || 1}</p>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.priceAtPurchase) * (item.quantity || 1))}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between font-bold text-gray-900">
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
