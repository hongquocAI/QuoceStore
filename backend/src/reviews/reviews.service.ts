import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';

// Toàn bộ module dùng envelope { success, data } — mirror OrdersService,
// ưu tiên nhất quán trong-module (CLAUDE.md đã chốt KHÔNG chuẩn hóa response
// toàn cục qua interceptor).
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // "Đã mua" = có OrderItem trỏ tới sản phẩm, thuộc Order của chính user, và
  // Order đã DELIVERED — chỉ "đã đặt" (kể cả COD) là kẽ hở review-rồi-hủy-đơn.
  private async hasPurchased(productId: string, userId: string): Promise<boolean> {
    const item = await this.prisma.orderItem.findFirst({
      where: { productId, order: { userId, shippingStatus: 'DELIVERED' } },
      select: { id: true },
    });
    return !!item;
  }

  async findAllByProduct(query: QueryReviewDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewWhereInput = { productId: query.productId };

    // $transaction để items/total/summary đọc trên cùng 1 ảnh chụp dữ liệu.
    const [items, total, aggregate, groupedByRating] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
      this.prisma.review.groupBy({ by: ['rating'], where, orderBy: { rating: 'asc' }, _count: true }),
    ]);

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of groupedByRating) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] = row._count as number;
    }

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          average: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : 0,
          count: total,
          distribution,
        },
      },
    };
  }

  async getEligibility(productId: string, userId: string) {
    const [purchased, myReview] = await Promise.all([
      this.hasPurchased(productId, userId),
      this.prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }),
    ]);

    if (myReview) {
      return { success: true, data: { canReview: false, reason: 'ALREADY_REVIEWED', myReview } };
    }
    if (!purchased) {
      return { success: true, data: { canReview: false, reason: 'NOT_PURCHASED', myReview: null } };
    }
    return { success: true, data: { canReview: true, reason: null, myReview: null } };
  }

  async create(dto: CreateReviewDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('productId không hợp lệ — sản phẩm không tồn tại.');
    }

    const purchased = await this.hasPurchased(dto.productId, userId);
    if (!purchased) {
      throw new ForbiddenException('Bạn cần mua và nhận sản phẩm này trước khi đánh giá.');
    }

    try {
      const review = await this.prisma.review.create({
        data: { productId: dto.productId, userId, rating: dto.rating, comment: dto.comment },
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      });
      return { success: true, data: review };
    } catch (error) {
      // Bắt lỗi DB (@@unique) thay vì check-rồi-insert — không có khe race
      // giữa 2 request song song cho cùng 1 cặp userId+productId.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi.');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateReviewDto, user: { id: string; role: Role }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (review.userId !== user.id) {
      throw new ForbiddenException('Bạn chỉ có thể sửa đánh giá của chính mình.');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { rating: dto.rating, comment: dto.comment },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    return { success: true, data: updated };
  }

  async remove(id: string, user: { id: string; role: Role }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (review.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này.');
    }

    await this.prisma.review.delete({ where: { id } });
    return { success: true, message: 'Đã xóa đánh giá.' };
  }
}
