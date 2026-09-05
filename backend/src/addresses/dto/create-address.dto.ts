import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  recipientName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng di động Việt Nam',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
