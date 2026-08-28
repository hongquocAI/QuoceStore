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
