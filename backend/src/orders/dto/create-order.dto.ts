import { IsNotEmpty, IsOptional, IsString, Matches, IsEmail, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ⚡ Tách riêng từng item trong giỏ hàng thành 1 DTO có validate rõ ràng,
// thay vì kiểu `Array<{ id, price, quantity }>` không được validate gì cả.
export class CartItemDto {
  @IsString()
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  id: string;

  // ⚡ Vẫn nhận variantId (optional) để chuẩn bị cho việc gắn đúng
  // biến thể màu đã chọn vào đơn hàng (xem thêm ghi chú ở cuối file).
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  // ⚡ CỐ TÌNH KHÔNG khai báo field `price` ở đây.
  // Nếu client gửi kèm price trong cart item, ValidationPipe (whitelist: true,
  // xem phần main.ts ở Phase 2) sẽ tự loại bỏ field lạ này. Giá luôn được
  // Server tự tra cứu lại từ DB trong OrdersService, không bao giờ đọc field
  // price này dù client có cố tình gửi lên.
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  customerName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng di động Việt Nam',
  })
  customerPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  customerEmail?: string;

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  // 🛡️ ĐÃ XÓA field `totalAmount` khỏi DTO.
  // Đây là lỗ hổng nghiêm trọng nhất đã phát hiện: trước đây client tự tính
  // và gửi totalAmount, server tin dùng thẳng -> có thể đặt hàng thật với
  // giá tự khai. Từ giờ OrdersService LUÔN tự tính totalAmount = tổng
  // (giá thật từ DB × số lượng) của từng item trong cart. Xem orders.service.ts.

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cart: CartItemDto[];

  // ⚡ Nhóm F: mã giảm giá optional. Server LUÔN tự validate qua
  // DiscountsService.validateCode() và tự tính lại số tiền giảm — client chỉ
  // được gửi MÃ, không bao giờ gửi kèm % giảm hay số tiền đã giảm (không có
  // field nào cho việc đó ở đây, và whitelist:true sẽ loại bỏ nếu cố gửi).
  @IsOptional()
  @IsString()
  discountCode?: string;
}
