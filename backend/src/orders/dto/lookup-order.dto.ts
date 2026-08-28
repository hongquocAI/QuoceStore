import { IsInt, IsNotEmpty, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LookupOrderDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  orderCode: number;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại phải đúng định dạng di động Việt Nam' })
  customerPhone: string;
}