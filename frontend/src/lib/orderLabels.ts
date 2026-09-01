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

// ⚡ G4 (2026-09-02): trích ra dùng chung — trước đây chỉ khai báo cục bộ
// trong admin/orders/page.tsx, giờ orders/page.tsx (modal chi tiết) cũng
// cần đúng bảng màu này cho badge shippingStatus.
export const SHIPPING_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// ⚡ Đợt 4 Nhóm G (2026-09-02): thứ tự chuẩn cho stepper trực quan trạng
// thái giao hàng. CANCELLED KHÔNG nằm trong luồng tuyến tính — chỗ gọi
// phải tự kiểm tra riêng (nếu CANCELLED, hiện cảnh báo thay vì stepper).
export const SHIPPING_STATUS_ORDER: ShippingStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

// ⚡ G4 (2026-09-02): dùng cho modal chi tiết orders/page.tsx +
// orders/lookup/page.tsx. KHÔNG đổi checkout/page.tsx (đang dùng ternary
// inline y hệt nội dung) — tránh đụng lại file vừa test luồng tiền thật.
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản VietQR',
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
