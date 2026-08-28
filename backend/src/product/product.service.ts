import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
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

  // ⚡ Nhóm B — PHÂN TRANG:
  //
  // `include` đầy đủ 4 quan hệ (category/subCategory/brand/variants) được giữ
  // nguyên như trước để Frontend không phải đổi cách render từng sản phẩm —
  // nhưng chính vì payload mỗi bản ghi nặng như vậy, việc trả về TOÀN BỘ bảng
  // như code cũ là nút thắt thật khi catalog lớn lên. Nay mọi lời gọi đều bị
  // giới hạn bởi `take` (tối đa 100, xem QueryProductDto).
  //
  // ❗ KHÔNG cache danh sách sản phẩm ở đây — có chủ ý. Theo đúng tiền lệ đã
  // áp dụng ở SubCategoriesService: chỉ cache lời gọi KHÔNG filter, bỏ qua
  // cache khi có filter, "để tránh nổ số lượng cache key". Ở đây mọi lời gọi
  // đều mang page/limit/filter nên số tổ hợp key là vô hạn; hơn nữa cache
  // backend là Redis qua Keyv — interface `Cache` không hỗ trợ xoá theo
  // prefix/wildcard, nên các key đó sẽ KHÔNG THỂ invalidate đúng sau mỗi lần
  // create/update/remove sản phẩm. Cache sai còn tệ hơn không cache.
  private buildProductWhere(
    query: QueryProductDto,
    publicOnly: boolean,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    // Storefront công khai chỉ được thấy sản phẩm đang bán. Schema KHÔNG có
    // isDeleted/deletedAt — `isActive` là cờ hiển thị duy nhất, và cũng chính
    // là cờ mà remove() lật xuống false khi sản phẩm đã có lịch sử đơn hàng
    // (soft-delete). Admin thì thấy hết.
    if (publicOnly) where.isActive = true;

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subCategoryId) where.subCategoryId = query.subCategoryId;
    if (query.brandId) where.brandId = query.brandId;

    // Tìm theo title HOẶC sku — giữ đúng hành vi ô tìm kiếm sẵn có của trang
    // Admin (trước đây lọc ở client theo cả 2 trường này).
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findPaginated(query: QueryProductDto, publicOnly: boolean) {
    // Giá trị mặc định trong DTO chỉ áp dụng khi param vắng mặt; vẫn chốt lại
    // ở đây để service an toàn kể cả khi được gọi trực tiếp (VD từ test).
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildProductWhere(query, publicOnly);

    // $transaction để findMany và count đọc trên cùng 1 ảnh chụp dữ liệu —
    // tránh trường hợp total lệch với items khi có ghi xen giữa 2 truy vấn.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true, subCategory: true, brand: true, variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      // Không có kết quả vẫn trả 1 (không phải 0) để UI luôn hiển thị được
      // "Trang 1 / 1" thay vì "Trang 1 / 0".
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findAll(query: QueryProductDto) {
    return await this.findPaginated(query, true);
  }

  async findAllForAdmin(query: QueryProductDto) {
    return await this.findPaginated(query, false);
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

      // 🛡️ FIX: trước đây `dto.variants` được DTO validate rồi VỨT ĐI IM LẶNG
      // (object `data` phía trên không hề có key `variants`) — Admin sửa màu
      // sắc/tồn kho biến thể thì UI báo "thành công" nhưng DB không hề đổi.
      //
      // Cách xử lý: XÓA SẠCH variant cũ rồi TẠO LẠI từ payload (thay vì so
      // khớp/upsert từng cái). An toàn vì `OrderItem.variantId` là
      // `onDelete: SetNull` VÀ OrderItem đã lưu sẵn `variantColorName` như 1
      // bản snapshot tại thời điểm mua — nên variant có bị đổi id thì lịch sử
      // đơn hàng cũ vẫn giữ đúng tên màu khách đã chọn.
      //
      // Phân biệt 3 trường hợp:
      //   - dto.variants === undefined  -> KHÔNG đụng gì tới variants
      //   - dto.variants === []         -> xóa hết, sản phẩm thành hàng đơn lẻ
      //   - dto.variants có phần tử     -> xóa hết rồi tạo lại đúng danh sách
      if (dto.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      // Giá biến thể bỏ trống thì lấy theo giá sản phẩm — giống hệt create().
      // Ở update, dto.price có thể không được gửi lên nên phải lùi về giá
      // hiện tại trong DB thay vì để undefined.
      const fallbackPrice = dto.price ?? product.price;

      return await tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(dto.variants !== undefined &&
            dto.variants.length > 0 && {
              variants: {
                create: dto.variants.map((v) => ({
                  colorCode: v.colorCode,
                  colorName: v.colorName,
                  hexCode: v.hexCode,
                  price: v.price && v.price > 0 ? v.price : fallbackPrice,
                  stock: v.stock ?? 0,
                  images: v.images ?? [],
                })),
              },
            }),
        },
        // `include` chạy SAU khi ghi -> trả về đúng danh sách variant MỚI,
        // Frontend hiển thị đúng ngay, không cần F5.
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