"use client";
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Order, ShippingStatus } from '@/types';
import { PAYMENT_STATUS_LABEL, SHIPPING_STATUS_LABEL, SHIPPING_STATUS_BADGE } from '@/lib/orderLabels';
import ConfirmModal from '@/components/common/ConfirmModal';

// ⚡ Đồng bộ với SHIPPING_STATUS_TRANSITIONS trong
// backend/src/orders/orders.service.ts — CHỈ để ẩn/hiện lựa chọn hợp lệ
// trên UI. Server vẫn là nơi validate thật, không tin riêng danh sách này.
const SHIPPING_STATUS_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ALL_STATUSES: ShippingStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const formatMoney = (n: number) => `${Number(n).toLocaleString('vi-VN')} đ`;

export default function AdminOrdersPage() {
  // ⚡ Nhóm G Đợt 1: guard role ADMIN + redirect đã dồn về
  // app/admin/layout.tsx (AdminGuard) — component này chỉ mount khi chắc
  // chắn đã xác thực ADMIN, không cần tự check lại `user`/`authLoading`.
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 20;

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ order: Order; nextStatus: ShippingStatus; message: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      // ❗ Giống ProductController: forbidNonWhitelisted đang bật — CHỈ đính
      // kèm param khi thực sự có lọc, tuyệt đối không gửi sentinel 'ALL'.
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedStatusFilter !== 'ALL') params.shippingStatus = selectedStatusFilter;

      // ⚠️ Khác 1 tầng so với /products/admin/all: response ở đây bọc thêm
      // {success, data: {...}} (giữ đúng convention sẵn có của OrdersService),
      // nên đọc res.data.data.items chứ KHÔNG phải res.data.items.
      const res = await api.get('/orders/admin/all', { params });
      const paginated = res.data?.data;
      setOrders(Array.isArray(paginated?.items) ? paginated.items : []);
      setTotalPages(paginated?.totalPages ?? 1);
      setTotalOrders(paginated?.total ?? 0);

      if (paginated?.totalPages && currentPage > paginated.totalPages) {
        setCurrentPage(paginated.totalPages);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setMessage({ type: 'error', text: 'BẠN KHÔNG CÓ QUYỀN TRUY CẬP DỮ LIỆU NÀY.' });
      } else {
        setMessage({ type: 'error', text: 'Không thể tải danh sách đơn hàng.' });
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ⚡ Nhóm G: tách khỏi window.confirm() — build message rồi lưu vào state
  // `confirmAction` để ConfirmModal hiển thị, người dùng bấm Xác nhận mới
  // thực sự gọi handleUpdateStatus() bên dưới.
  const requestUpdateStatus = (order: Order, nextStatus: ShippingStatus) => {
    // ⚠️ GIỚI HẠN QUAN TRỌNG: hệ thống CHỈ tự động hoàn kho khi hủy đơn,
    // TUYỆT ĐỐI KHÔNG tự động hoàn tiền qua PayOS dù đơn đã thanh toán.
    // Phải cảnh báo rõ để Admin không hiểu nhầm hủy xong là khách tự động
    // được hoàn tiền — xem comment tương ứng ở
    // backend/src/orders/orders.service.ts (updateShippingStatus).
    let confirmMessage = `Xác nhận chuyển đơn #${order.orderCode} sang trạng thái "${SHIPPING_STATUS_LABEL[nextStatus]}"?`;
    if (nextStatus === 'CANCELLED') {
      confirmMessage = `Xác nhận HỦY đơn #${order.orderCode}? Hệ thống sẽ tự động hoàn lại tồn kho.`;
      if (order.paymentStatus === 'PAID') {
        confirmMessage +=
          '\n\n⚠️ Đơn hàng này ĐÃ THANH TOÁN qua VietQR. Hệ thống chỉ tự động hoàn kho, ' +
          'KHÔNG tự động hoàn tiền cho khách — bạn cần tự hoàn tiền thủ công qua PayOS Dashboard.';
      }
    }
    setConfirmAction({ order, nextStatus, message: confirmMessage });
  };

  const handleUpdateStatus = async (order: Order, nextStatus: ShippingStatus) => {
    try {
      setUpdatingId(order.id);
      await api.patch(`/orders/${order.id}/shipping-status`, { shippingStatus: nextStatus });
      setMessage({ type: 'success', text: `ĐÃ CẬP NHẬT ĐƠN #${order.orderCode} THÀNH CÔNG!` });
      await fetchOrders();
      // Modal chi tiết đang mở đúng đơn vừa đổi -> đóng lại để tránh hiển thị
      // trạng thái cũ (dữ liệu trong modal không tự refresh).
      if (detailOrder?.id === order.id) setDetailOrder(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased pb-28">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 border-b border-gray-200">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">QUOCÉ WORLD-CLASS ENTERPRISE PIM</span>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-[#111] mt-1">
          QUẢN LÝ ĐƠN HÀNG
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {message.text && (
          <div className={`mb-8 p-4 text-xs font-bold uppercase tracking-wider text-center rounded-none border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
          <input
            type="text"
            placeholder="TÌM THEO MÃ ĐƠN / SĐT / TÊN KHÁCH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-white border border-gray-300 text-xs font-medium px-4 py-3 rounded-none focus:outline-none focus:border-black uppercase"
          />
          <select
            value={selectedStatusFilter}
            onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-gray-300 text-xs font-bold uppercase px-4 py-3 rounded-none cursor-pointer"
          >
            <option value="ALL">TẤT CẢ TRẠNG THÁI</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{SHIPPING_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 overflow-x-auto rounded-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f8f8] border-b border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700">
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">SĐT</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Thanh toán</th>
                <th className="p-4">Trạng thái giao hàng</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs font-medium">
              {ordersLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 uppercase tracking-wider animate-pulse">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 uppercase tracking-wider">
                    Không tìm thấy đơn hàng phù hợp.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const nextOptions = SHIPPING_STATUS_TRANSITIONS[order.shippingStatus];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono font-bold">#{order.orderCode}</td>
                      <td className="p-4 uppercase">{order.customerName}</td>
                      <td className="p-4 font-mono">{order.customerPhone}</td>
                      <td className="p-4 font-bold">{formatMoney(order.totalAmount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${SHIPPING_STATUS_BADGE[order.shippingStatus]}`}>
                          {SHIPPING_STATUS_LABEL[order.shippingStatus]}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="bg-gray-200 text-black text-[10px] font-bold uppercase px-3 py-1.5 rounded-none hover:bg-black hover:text-white transition"
                        >
                          Chi tiết
                        </button>
                        {nextOptions.map((next) => (
                          <button
                            key={next}
                            disabled={updatingId === order.id}
                            onClick={() => requestUpdateStatus(order, next)}
                            className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-none transition border disabled:opacity-40 ${
                              next === 'CANCELLED'
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                                : 'bg-white text-black border-gray-300 hover:bg-black hover:text-white'
                            }`}
                          >
                            {next === 'CANCELLED' ? 'Hủy đơn' : SHIPPING_STATUS_LABEL[next]}
                          </button>
                        ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 text-xs font-bold uppercase">
          <span className="text-gray-500">
            Trang {currentPage} / {totalPages} — Tổng {totalOrders} đơn hàng
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || ordersLoading}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-gray-100 disabled:opacity-40 hover:bg-black hover:text-white transition"
            >
              Trang trước
            </button>
            <button
              disabled={currentPage >= totalPages || ordersLoading}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-gray-100 disabled:opacity-40 hover:bg-black hover:text-white transition"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto px-4 py-10">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white border border-gray-300 w-full max-w-2xl p-8 rounded-none shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <h2 className="text-lg font-black uppercase tracking-wider">Đơn hàng #{detailOrder.orderCode}</h2>
                <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-black text-xl leading-none">×</button>
              </div>

              <div className="space-y-1 text-sm mb-6">
                <p><span className="text-gray-500">Khách hàng:</span> <span className="font-bold">{detailOrder.customerName}</span></p>
                <p><span className="text-gray-500">SĐT:</span> {detailOrder.customerPhone}</p>
                {detailOrder.customerEmail && <p><span className="text-gray-500">Email:</span> {detailOrder.customerEmail}</p>}
                <p><span className="text-gray-500">Địa chỉ:</span> {detailOrder.address}</p>
                <p><span className="text-gray-500">Phương thức thanh toán:</span> {detailOrder.paymentMethod}</p>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                {detailOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>
                      {item.product?.title || 'Sản phẩm đã xóa'}
                      {item.variantColorName && <span className="text-gray-400"> ({item.variantColorName})</span>}
                      {' '}× {item.quantity}
                    </span>
                    <span className="font-bold">{formatMoney(item.priceAtPurchase * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                {detailOrder.discountAmount > 0 && (
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
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.nextStatus === 'CANCELLED' ? 'Xác nhận hủy đơn' : 'Xác nhận đổi trạng thái'}
        message={confirmAction?.message ?? ''}
        danger={confirmAction?.nextStatus === 'CANCELLED'}
        confirmLabel={confirmAction?.nextStatus === 'CANCELLED' ? 'Hủy đơn' : 'Xác nhận'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) handleUpdateStatus(confirmAction.order, confirmAction.nextStatus);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
