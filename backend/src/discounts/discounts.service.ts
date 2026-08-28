import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async validateCode(code: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
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