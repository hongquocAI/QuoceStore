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

// 🛡️ Hướng B (2026-09-02): VietQR PENDING KHÔNG được gọi mập mờ là "Chưa
// thanh toán" giống COD PENDING (COD PENDING là trạng thái bình thường —
// khách sẽ trả tiền khi nhận hàng). VietQR PENDING nghĩa là tiền CHƯA về,
// tồn kho CHƯA bị trừ (xem OrdersService.create() + PaymentService.
// handleWebhook()) — cần label riêng để khách/admin không hiểu nhầm là đơn
// đã chốt xong. Dùng chung cho orders/page.tsx và orders/lookup/page.tsx.
export function getPaymentStatusDisplay(order: { paymentStatus: string; paymentMethod?: string }): string {
  if (order.paymentStatus === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER') {
    return 'Đang chờ thanh toán';
  }
  return PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus;
}
