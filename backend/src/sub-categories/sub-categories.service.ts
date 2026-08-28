import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

const CACHE_KEY_ALL = 'sub-categories:all';
const CACHE_TTL = 60 * 60 * 1000;

@Injectable()
export class SubCategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(categoryId?: string) {
    // ⚡ Chỉ cache khi gọi KHÔNG filter (dropdown "tất cả subcategory") —
    // trường hợp filter theo categoryId ít gặp hơn, query DB trực tiếp
    // (nhẹ, có index sẵn trên categoryId) để tránh nổ số lượng cache key.
    if (!categoryId) {
      const cached = await this.cache.get<any[]>(CACHE_KEY_ALL);
      if (cached) return cached;

      const all = await this.prisma.subCategory.findMany({ orderBy: { name: 'asc' } });
      await this.cache.set(CACHE_KEY_ALL, all, CACHE_TTL);
      return all;
    }

    return this.prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateSubCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new BadRequestException('categoryId không hợp lệ — danh mục cha không tồn tại.');
    }
    const existing = await this.prisma.subCategory.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`SubCategory với slug "${dto.slug}" đã tồn tại.`);
    }

    const subCategory = await this.prisma.subCategory.create({ data: dto });
    await this.cache.del(CACHE_KEY_ALL);
    return subCategory;
  }

  async remove(id: string) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!subCategory) throw new NotFoundException('Không tìm thấy danh mục con.');
    if (subCategory._count.products > 0) {
      throw new ConflictException(
        `Không thể xóa: đang có ${subCategory._count.products} sản phẩm thuộc danh mục con này.`,
      );
    }
    await this.prisma.subCategory.delete({ where: { id } });
    await this.cache.del(CACHE_KEY_ALL);
    return { success: true, message: 'Đã xóa danh mục con.' };
  }
}