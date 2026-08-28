import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Order ID không được để trống' })
  orderId: string;

  // ⚡ ĐÃ XÓA field `amount` khỏi DTO.
  // Lý do: Số tiền thanh toán KHÔNG BAO GIỜ được phép đến từ client.
  // Service sẽ tự tính amount = order.totalAmount (đã được server chốt tại lúc tạo Order).
  // Nếu client vẫn gửi field `amount` lên, ValidationPipe với `whitelist: true`
  // (xem note ở main.ts trong phần Auth/Phase 2) sẽ tự động loại bỏ field lạ này.

  @IsOptional()
  @IsString()
  @MaxLength(25, { message: 'Mô tả thanh toán tối đa 25 ký tự (giới hạn của PayOS)' })
  description?: string;
}
