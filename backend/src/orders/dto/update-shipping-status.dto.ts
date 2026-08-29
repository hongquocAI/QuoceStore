import { IsEnum } from 'class-validator';
import { ShippingStatus } from '@prisma/client';

export class UpdateShippingStatusDto {
  @IsEnum(ShippingStatus, { message: 'shippingStatus không hợp lệ' })
  shippingStatus: ShippingStatus;
}
