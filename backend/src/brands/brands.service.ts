import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

const CACHE_KEY = 'brands:all';
const CACHE_TTL = 60 * 60 * 1000; // 1 giờ — brand hiếm khi đổi

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll() {
    const cached = await this.cache.get<any[]>(CACHE_KEY);
    if (cached) return cached;

    const brands = await this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
    await this.cache.set(CACHE_KEY, brands, CACHE_TTL);
    return brands;
  }

  async create(dto: CreateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Brand với slug "${dto.slug}" đã tồn tại.`);
    }
    const brand = await this.prisma.brand.create({ data: dto });

    // 🛡️ Invalidate cache — xóa ngay để lần GET tiếp theo lấy lại data mới
    // nhất từ DB, tránh hiện tượng "tạo brand mới nhưng dropdown không thấy".
    await this.cache.del(CACHE_KEY);

    return brand;
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu.');
    if (brand._count.products > 0) {
      throw new ConflictException(
        `Không thể xóa: đang có ${brand._count.products} sản phẩm thuộc thương hiệu này.`,
      );
    }
    await this.prisma.brand.delete({ where: { id } });
    await this.cache.del(CACHE_KEY);
    return { success: true, message: 'Đã xóa thương hiệu.' };
  }
}