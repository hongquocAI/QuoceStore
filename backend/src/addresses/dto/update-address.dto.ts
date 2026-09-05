import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

// KHÔNG có isDefault ở đây có chủ đích — đặt mặc định đi qua route riêng
// PATCH /addresses/:id/set-default (mirror pattern
// PATCH /orders/:id/shipping-status tách khỏi update thông thường).
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  recipientName?: string;

  @IsOptional()
  @Matches(/^(84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng di động Việt Nam',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address?: string;
}
