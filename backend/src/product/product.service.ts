import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async create(dto: CreateProductDto) {
    // 🛡️ FIX (Phase 1): validate CẢ 3 FK (category, subCategory, brand) tồn
    // tại thật trước khi vào transaction — trả lỗi rõ ràng thay vì để
    // Postgres ném FK constraint error thô. Đồng thời kiểm tra subCategory
    // thực sự thuộc về category đã chọn (tránh trường hợp Admin lỡ chọn
    // nhầm subCategory của 1 category khác qua API trực tiếp, dù UI dropdown
    // đã lọc đúng, vẫn nên chặn ở tầng Service).
    const [category, subCategory, brand] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: dto.categoryId } }),
      this.prisma.subCategory.findUnique({ where: { id: dto.subCategoryId } }),
      this.prisma.brand.findUnique({ where: { id: dto.brandId } }),
    ]);

    if (!category) throw new BadRequestException('categoryId không hợp lệ — danh mục không tồn tại.');
    if (!subCategory) throw new BadRequestException('subCategoryId không hợp lệ — danh mục con không tồn tại.');
    if (subCategory.categoryId !== dto.categoryId) {
      throw new BadRequestException('SubCategory đã chọn không thuộc về Category đã chọn.');
    }
    if (!brand) throw new BadRequestException('brandId không hợp lệ — thương hiệu không tồn tại.');

    return await this.prisma.$transaction(async (tx) => {
      const existingSlug = await tx.product.findUnique({ where: { slug: dto.slug } });
      if (existingSlug) {
        throw new ConflictException('Slug sản phẩm đã tồn tại trong hệ thống');
      }

      const safeImages = dto.images ?? [];
      const safeThumbnail = dto.thumbnail || safeImages[0] || '';

      let finalSku: string;
      if (dto.sku?.trim()) {
        const skuExists = await tx.product.findUnique({ where: { sku: dto.sku.trim() } });
        if (skuExists) {
          throw new ConflictException(`Mã SKU "${dto.sku.trim()}" đã tồn tại, vui lòng chọn mã khác.`);
        }
        finalSku = dto.sku.trim();
      } else {
        // ⚡ FIX: sinh SKU dựa trên brand.slug tra được từ DB (không còn
        // dto.brandSlug vì field đó đã bị xóa khỏi DTO ở Phase 1).
        finalSku = await this.generateUniqueSku(tx, brand.slug, dto.slug);
      }

      const product = await tx.product.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          sku: finalSku,
          categoryId: dto.categoryId,
          subCategoryId: dto.subCategoryId,
          brandId: dto.brandId,
          description: dto.description,
          price: dto.price,
          originalPrice: dto.originalPrice,
          stock: dto.stock,
          isActive: dto.isActive ?? true,
          thumbnail: safeThumbnail,
          images: safeImages,
          highlights: dto.highlights ?? [],
          specs: dto.specs ?? Prisma.JsonNull, // ⚡ FIX: dùng Prisma.JsonNull thay vì {} khi không có specs
          variants:
            dto.variants && dto.variants.length > 0
              ? {
                  create: dto.variants.map((v) => ({
                    colorCode: v.colorCode,
                    colorName: v.colorName,
                    hexCode: v.hexCode,
                    price: v.price && v.price > 0 ? v.price : dto.price,
                    stock: v.stock ?? 0,
                    images: v.images ?? [],
                  })),
                }
              : undefined,
        },
        include: { variants: true, category: true, subCategory: true, brand: true },
      });
      return product;
    });
  }

  private async generateUniqueSku(
    tx: Prisma.TransactionClient,
    brandSlug: string,
    slug: string,
  ): Promise<string> {
    const base = `QUO-${brandSlug.toUpperCase().slice(0, 10)}-${slug.toUpperCase().slice(0, 12)}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const exists = await tx.product.findUnique({ where: { sku: candidate } });
      if (!exists) return candidate;
    }

    throw new ConflictException('Không thể sinh mã SKU duy nhất, vui lòng thử lại hoặc nhập SKU thủ công.');
  }

  async findAll() {
    return await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { category: true, subCategory: true, brand: true, variants: true },
    });
  }

  async findAllForAdmin() {
    return await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true, subCategory: true, brand: true, variants: true },
    });
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, subCategory: true, brand: true, variants: true },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với định danh: ${slug}`);
    }
    return product;
  }

  async findAllCategories() {
    const CACHE_KEY = 'categories:all';
    const cached = await this.cache.get<any[]>(CACHE_KEY);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany();
    await this.cache.set(CACHE_KEY, categories, 60 * 60 * 1000); // 1 giờ
    return categories;
  }

  async update(id: string, dto: UpdateProductDto) {
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      // 🛡️ Validate từng FK nếu client cố đổi sang giá trị khác
      if (dto.categoryId && dto.categoryId !== product.categoryId) {
        const category = await tx.category.findUnique({ where: { id: dto.categoryId } });
        if (!category) throw new BadRequestException('categoryId không hợp lệ — danh mục không tồn tại.');
      }
      if (dto.subCategoryId && dto.subCategoryId !== product.subCategoryId) {
        const subCategory = await tx.subCategory.findUnique({ where: { id: dto.subCategoryId } });
        if (!subCategory) throw new BadRequestException('subCategoryId không hợp lệ.');
        const effectiveCategoryId = dto.categoryId ?? product.categoryId;
        if (subCategory.categoryId !== effectiveCategoryId) {
          throw new BadRequestException('SubCategory đã chọn không thuộc về Category đã chọn.');
        }
      }
      if (dto.brandId && dto.brandId !== product.brandId) {
        const brand = await tx.brand.findUnique({ where: { id: dto.brandId } });
        if (!brand) throw new BadRequestException('brandId không hợp lệ — thương hiệu không tồn tại.');
      }

      if (dto.sku && dto.sku.trim() !== product.sku) {
        const skuExists = await tx.product.findFirst({
          where: { sku: dto.sku.trim(), NOT: { id } },
        });
        if (skuExists) {
          throw new ConflictException(`Mã SKU "${dto.sku.trim()}" đã được dùng bởi sản phẩm khác.`);
        }
      }

      // ⚡ FIX: chỉ build key nào THỰC SỰ có trong dto (khác undefined) —
      // để Prisma tự giữ nguyên giá trị cũ cho field không được gửi lên,
      // thay vì pattern "dto.x ?? product.x" (cách cũ gây lỗi type với
      // field Json vì product.specs có thể là `null` literal, không được
      // Prisma chấp nhận gán trực tiếp).
      const data: Prisma.ProductUpdateInput = {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.categoryId !== undefined && { category: { connect: { id: dto.categoryId } } }),
        ...(dto.subCategoryId !== undefined && { subCategory: { connect: { id: dto.subCategoryId } } }),
        ...(dto.brandId !== undefined && { brand: { connect: { id: dto.brandId } } }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.highlights !== undefined && { highlights: dto.highlights }),
        ...(dto.specs !== undefined && { specs: dto.specs ?? Prisma.JsonNull }),
        // slug KHÔNG xuất hiện ở đây — bất biến, đúng nguyên tắc SEO.
      };

      return await tx.product.update({
        where: { id },
        data,
        include: { variants: true, category: true, subCategory: true, brand: true },
      });
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    if (product._count.orderItems > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message:
          'Sản phẩm đã có lịch sử đơn hàng nên không thể xóa vĩnh viễn — đã chuyển sang trạng thái ngừng kinh doanh (ẩn khỏi cửa hàng).',
      };
    }

    await this.prisma.product.delete({ where: { id } });
    return { success: true, message: 'Đã xóa sản phẩm thành công khỏi hệ thống.' };
  }
}