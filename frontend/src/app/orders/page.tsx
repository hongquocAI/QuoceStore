"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  getPaymentStatusDisplay,
  SHIPPING_STATUS_LABEL,
  SHIPPING_STATUS_BADGE,
  SHIPPING_STATUS_ORDER,
  PAYMENT_METHOD_LABEL,
} from '@/lib/orderLabels';
import { ShippingStatus } from '@/types';

// ⚡ Nhóm G Đợt C: badge vuông đen-trắng/đỏ theo chuẩn Storefront, dùng
// getPaymentStatusDisplay() dùng chung (frontend/src/lib/orderLabels.ts) —
// trước đây hiện thẳng mã status thô (PENDING/PAID) không dịch, không đồng
// bộ với nhãn tiếng Việt đã có sẵn ở admin/orders/page.tsx.
// 🛡️ Hướng B (2026-09-02): thêm nhánh amber riêng cho VietQR PENDING (tiền
// chưa về) — không dùng chung màu xám trung tính với COD PENDING (bình
// thường, sẽ trả khi nhận hàng), tránh gây hiểu nhầm là 2 trạng thái giống
// nhau.
function getPaymentStatusBadge(order: { paymentStatus: string; paymentMethod?: string }): string {
  if (order.paymentStatus === 'PAID') return 'bg-black text-white';
  if (order.paymentStatus === 'CANCELLED' || order.paymentStatus === 'FAILED') return 'bg-red-600 text-white';
  if (order.paymentStatus === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER') {
    return 'bg-amber-100 text-amber-800 border border-amber-300';
  }
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));

// ⚡ G4 (2026-09-02): lấy ảnh sản phẩm — khớp đúng cách đang dùng cho item
// row (product.images[0] hoặc product.image), dùng lại cho cả list và modal.
function getItemImage(item: any): string | null {
  return item.product?.images?.[0] || item.product?.image || null;
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // ⚡ G4: modal chi tiết đọc-chỉ — dữ liệu lấy từ ĐÚNG order object đã có
  // sẵn trong `orders` (findByUser() đã include đầy đủ product/variant),
  // không cần gọi API thêm khi mở modal.
  const [detailOrder, setDetailOrder] = useState<any>(null);
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
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mã đơn: #{order.orderCode || order.id?.slice(0, 8)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-3 py-1.5 rounded-none uppercase font-black tracking-widest ${getPaymentStatusBadge(order)}`}>
                      {getPaymentStatusDisplay(order)}
                    </span>
                    <span className={`text-[10px] px-3 py-1.5 rounded-none uppercase font-black tracking-widest ${SHIPPING_STATUS_BADGE[order.shippingStatus as ShippingStatus]}`}>
                      {SHIPPING_STATUS_LABEL[order.shippingStatus as ShippingStatus]}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.orderItems?.map((item: any) => {
                    const productImg = getItemImage(item);

                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#f4f4f4] rounded-none overflow-hidden flex-shrink-0 border border-gray-200/80 flex items-center justify-center">
                            {productImg ? (
                              <img src={productImg} alt={item.product?.title || 'Sản phẩm'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black">QUOCÉ</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                            {item.variantColorName && (
                              <p className="text-[11px] text-gray-400 mt-0.5">Màu: {item.variantColorName}</p>
                            )}
                            <p className="text-[11px] text-gray-400">Số lượng: {item.quantity || 1}</p>
                          </div>
                        </div>

                        <p className="text-sm font-black text-gray-900">
                          {formatMoney(Number(item.priceAtPurchase) * (item.quantity || 1))}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setDetailOrder(order)}
                    className="text-[11px] font-bold uppercase tracking-wider px-4 py-2 border border-gray-300 rounded-none hover:bg-black hover:text-white transition"
                  >
                    Xem chi tiết
                  </button>
                  <div className="flex items-baseline gap-2 font-black text-gray-900 text-sm uppercase tracking-wide">
                    <span>Tổng tiền:</span>
                    <span>{formatMoney(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG — đọc-chỉ, không có hành động nào bên
          trong (khác admin/orders/page.tsx), dùng đúng data đã có sẵn */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto px-4 py-10">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white border border-gray-300 w-full max-w-2xl rounded-none shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-black">
                    Chi tiết đơn #{detailOrder.orderCode}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(detailOrder.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailOrder(null)}
                  className="text-xs font-bold uppercase px-3 py-1 bg-gray-100 hover:bg-black hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ⚡ Đợt 4 Nhóm G: timeline trực quan trạng thái giao hàng —
                    CANCELLED không nằm trong luồng tuyến tính, hiện cảnh báo
                    riêng thay vì stepper. */}
                {detailOrder.shippingStatus === 'CANCELLED' ? (
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-200 rounded-none p-3">
                    Đơn hàng đã bị hủy
                  </p>
                ) : (
                  <div className="flex items-center">
                    {SHIPPING_STATUS_ORDER.map((step, idx) => {
                      const currentIdx = SHIPPING_STATUS_ORDER.indexOf(detailOrder.shippingStatus as ShippingStatus);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-6 h-6 flex items-center justify-center text-[10px] font-black border-2 rounded-none ${
                                isDone ? 'bg-black text-white border-black' : 'bg-white text-gray-300 border-gray-300'
                              } ${isCurrent ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                            >
                              {idx + 1}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wide text-center whitespace-nowrap ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                              {SHIPPING_STATUS_LABEL[step]}
                            </span>
                          </div>
                          {idx < SHIPPING_STATUS_ORDER.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 ${idx < currentIdx ? 'bg-black' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] px-3 py-1.5 rounded-none uppercase font-black tracking-widest ${getPaymentStatusBadge(detailOrder)}`}>
                    {getPaymentStatusDisplay(detailOrder)}
                  </span>
                  <span className={`text-[10px] px-3 py-1.5 rounded-none uppercase font-black tracking-widest ${SHIPPING_STATUS_BADGE[detailOrder.shippingStatus as ShippingStatus]}`}>
                    {SHIPPING_STATUS_LABEL[detailOrder.shippingStatus as ShippingStatus]}
                  </span>
                </div>

                <div className="border border-gray-200 rounded-none p-4 space-y-2 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 font-bold uppercase tracking-wide flex-shrink-0">Phương thức thanh toán</span>
                    <span className="font-bold text-gray-900 text-right">
                      {PAYMENT_METHOD_LABEL[detailOrder.paymentMethod] || detailOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 font-bold uppercase tracking-wide flex-shrink-0">Địa chỉ giao hàng</span>
                    <span className="font-bold text-gray-900 text-right">{detailOrder.address}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {detailOrder.orderItems?.map((item: any) => {
                    const productImg = getItemImage(item);
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#f4f4f4] rounded-none overflow-hidden flex-shrink-0 border border-gray-200/80 flex items-center justify-center">
                            {productImg ? (
                              <img src={productImg} alt={item.product?.title || 'Sản phẩm'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest font-black">QUOCÉ</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-gray-900">{item.product?.title || 'Sản phẩm'}</p>
                            {item.variantColorName && (
                              <p className="text-[11px] text-gray-400 mt-0.5">Màu: {item.variantColorName}</p>
                            )}
                            <p className="text-[11px] text-gray-400">
                              SL: {item.quantity || 1} × {formatMoney(item.priceAtPurchase)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-gray-900">
                          {formatMoney(Number(item.priceAtPurchase) * (item.quantity || 1))}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  {Number(detailOrder.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Giảm giá {detailOrder.discountCode ? `(${detailOrder.discountCode})` : ''}</span>
                      <span>-{formatMoney(detailOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base">
                    <span>Tổng cộng</span>
                    <span>{formatMoney(detailOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
