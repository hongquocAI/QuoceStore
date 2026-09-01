import { ShippingStatus } from '@/types';

// ⚡ Trích ra dùng chung — trước đây chỉ khai báo cục bộ trong
// admin/orders/page.tsx, orders/page.tsx (lịch sử đơn hàng khách) cần đúng
// dictionary này nên tái dùng thay vì chép lại.
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
};

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đã giao vận',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
};
