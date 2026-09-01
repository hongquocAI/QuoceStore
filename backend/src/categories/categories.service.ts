import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

// ⚡ Đợt 4 Nhóm G (2026-09-02): Category trước đây CHỈ đọc được qua
// GET /products/categories (ProductService.findAllCategories()), không có
// đường ghi nào — Admin phải seed DB tay. Module này mirror 1:1 pattern đã
// có ở BrandsService/SubCategoriesService (2 tiền lệ y hệt trong dự án).
//
// ⚠️ PHỤ THUỘC CHÉO MODULE: cache key 'categories:all' vốn do
// ProductService.findAllCategories() (product.service.ts) ghi và đọc —
// KHÔNG có CategoriesService nào sở hữu key này trước đây. Phải invalidate
// ĐÚNG key này ở đây để tránh "tạo category mới nhưng dropdown không thấy".
const CACHE_KEY_ALL = 'categories:all';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Category với slug "${dto.slug}" đã tồn tại.`);
    }
    const category = await this.prisma.category.create({ data: dto });
    await this.cache.del(CACHE_KEY_ALL);
    return category;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục.');
    if (category._count.products > 0) {
      throw new ConflictException(
        `Không thể xóa: đang có ${category._count.products} sản phẩm thuộc danh mục này.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.cache.del(CACHE_KEY_ALL);
    return { success: true, message: 'Đã xóa danh mục.' };
  }
}
