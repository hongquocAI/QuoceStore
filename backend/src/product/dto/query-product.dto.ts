import { IsOptional, IsString, IsInt, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO cho query params của `GET /products` và `GET /products/admin/all`.
 *
 * ⚠️ LƯU Ý VỀ ValidationPipe TOÀN CỤC (xem main.ts):
 * - `transform: true` đang bật -> `@Type(() => Number)` tự chuyển query string
 *   ("2") thành number thật, KHÔNG cần ParseIntPipe thủ công.
 * - `forbidNonWhitelisted: true` đang bật -> mọi query param KHÔNG khai báo ở
 *   đây sẽ bị trả 400. Đây là hành vi mong muốn (chặn param rác), nhưng kéo
 *   theo 1 ràng buộc cho Frontend: TUYỆT ĐỐI không gửi giá trị sentinel kiểu
 *   `categoryId=ALL` — phải bỏ hẳn param đó ra khỏi request khi không lọc.
 * - Giá trị mặc định gán trực tiếp ở property chỉ có tác dụng khi param vắng
 *   mặt hoàn toàn, đúng nhu cầu ở đây.
 */
export class QueryProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page phải >= 1' })
  page?: number = 1;

  // Chặn trên 100 để 1 request không thể kéo cả bảng về (đúng mục tiêu của
  // việc phân trang) — client cố gửi limit=999 sẽ nhận 400.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải >= 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit?: number = 20;

  // Dùng @IsUUID (chặt hơn @IsString ở CreateProductDto) vì đây là giá trị đến
  // thẳng từ URL: loại sớm chuỗi rác, tránh tốn 1 truy vấn DB vô nghĩa.
  @IsOptional()
  @IsUUID('4', { message: 'categoryId phải là UUID hợp lệ' })
  categoryId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'subCategoryId phải là UUID hợp lệ' })
  subCategoryId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'brandId phải là UUID hợp lệ' })
  brandId?: string;

  // Tìm theo title HOẶC sku (xem buildProductWhere trong ProductService).
  @IsOptional()
  @IsString()
  search?: string;
}
