import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  // ⚡ Nhóm F: tham số `client` tùy chọn cho phép OrdersService gọi lại ĐÚNG
  // hàm validate này bên trong transaction tạo đơn hàng (truyền `tx` vào),
  // thay vì viết lại logic validate 1 lần nữa ở nơi khác — tránh 2 nơi có
  // thể lệch nhau. Mặc định vẫn dùng `this.prisma` nên DiscountsController
  // gọi như cũ, không đổi hành vi.
  async validateCode(code: string, client: Prisma.TransactionClient | PrismaService = this.prisma) {
    const discount = await client.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      throw new NotFoundException('Mã giảm giá không tồn tại hoặc đã khóa');
    }

    // 1. Kiểm tra ngày hết hạn
    if (discount.expiryDate && new Date() > discount.expiryDate) {
      throw new NotFoundException('Mã giảm giá đã hết hạn');
    }

    // 2. Kiểm tra số lượng lượt sử dụng (nếu maxUsage được thiết lập)
    if (discount.maxUsage !== null && discount.usedCount >= discount.maxUsage) {
      throw new NotFoundException('Mã giảm giá đã hết lượt sử dụng');
    }

    return discount;
  }
}