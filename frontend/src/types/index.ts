export type Role = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
export type ShippingStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

// ⚡ MỚI (Phase 1): khớp đúng bảng quan hệ thật thay vì string tự do
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface ProductVariant {
  id: string;
  colorCode: string;
  colorName: string;
  hexCode?: string | null;
  price?: number | null;
  stock: number;
  images: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku?: string | null;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  thumbnail?: string | null;
  images: string[];
  highlights: string[];
  specs?: Record<string, any> | null;
  isActive: boolean;
  categoryId: string;
  subCategoryId: string;
  brandId: string;
  category?: Category;
  subCategory?: SubCategory;
  brand?: Brand;
  variants?: ProductVariant[];
}

/**
 * Shape chuẩn của các endpoint danh sách có phân trang ở backend
 * (hiện tại: GET /products và GET /products/admin/all — Nhóm B).
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ⚡ Nhóm F: dùng cho trang quản lý đơn hàng Admin. Tối thiểu đủ field đang
// dùng, không thiết kế lại toàn bộ (Order/OrderItem chưa từng có type ở FE).
export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  variantColorName?: string | null;
  quantity: number;
  priceAtPurchase: number;
  product?: Product;
  variant?: ProductVariant;
}

// ⚡ Đánh giá sản phẩm — chỉ khách đã mua (DELIVERED) mới được review.
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; avatarUrl?: string | null };
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface ReviewEligibility {
  canReview: boolean;
  reason: 'ALREADY_REVIEWED' | 'NOT_PURCHASED' | null;
  myReview: Review | null;
}

export interface Order {
  id: string;
  orderCode: number;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  paymentMethod: string;
  totalAmount: number;
  discountCode?: string | null;
  discountAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
  orderItems: OrderItem[];
}
