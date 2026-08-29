import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingStatus } from '@prisma/client';

/**
 * DTO cho query params của `GET /orders/admin/all`.
 * Theo đúng khuôn mẫu QueryProductDto (src/product/dto/query-product.dto.ts).
 *
 * ⚠️ LƯU Ý VỀ ValidationPipe TOÀN CỤC (xem main.ts):
 * - `transform: true` đang bật -> `@Type(() => Number)` tự chuyển query string
 *   ("2") thành number thật, KHÔNG cần ParseIntPipe thủ công.
 * - `forbidNonWhitelisted: true` đang bật -> mọi query param KHÔNG khai báo ở
 *   đây sẽ bị trả 400. Frontend TUYỆT ĐỐI không gửi giá trị sentinel kiểu
 *   `shippingStatus=ALL` — phải bỏ hẳn param đó ra khỏi request khi không lọc.
 */
export class QueryOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải >= 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải >= 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ShippingStatus, { message: 'shippingStatus không hợp lệ' })
  shippingStatus?: ShippingStatus;

  // Tìm theo mã đơn (khớp chính xác nếu là số) HOẶC customerPhone/customerName
  // (contains) — xem OrdersService.findAllForAdmin().
  @IsOptional()
  @IsString()
  search?: string;
}
