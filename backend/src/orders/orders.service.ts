import { Injectable, BadRequestException, NotFoundException, ForbiddenException, HttpException, Logger } from '@nestjs/common';
import { Prisma, ShippingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { LookupOrderDto } from './dto/lookup-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateShippingStatusDto } from './dto/update-shipping-status.dto';

// ⚡ Trang quản lý đơn hàng Admin: state machine cho shippingStatus.
// PENDING/PROCESSING có thể hủy (chưa giao); SHIPPED chỉ có thể tiến tới
// DELIVERED (đã giao vận thì không hủy ngang được nữa — hàng đang trên
// đường, hủy lúc này cần quy trình thu hồi riêng, ngoài phạm vi trang này);
// DELIVERED/CANCELLED là trạng thái CUỐI, không đổi tiếp được.
const SHIPPING_STATUS_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private discountsService: DiscountsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    let targetUserId = createOrderDto.userId;

    if (targetUserId) {
      const userExists = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!userExists) {
        throw new BadRequestException('Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn.');
      }
    } else {
      const guestUser = await this.prisma.user.upsert({
        where: { email: 'guest@quoce.vn' },
        update: {},
        create: {
          email: 'guest@quoce.vn',
          passwordHash: 'GUEST_ACCOUNT_NO_LOGIN',
          fullName: 'Khách vãng lai',
          role: 'CUSTOMER',
          isActive: false,
        },
      });
      targetUserId = guestUser.id;
    }

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const orderItemsData: Array<{
          productId: string;
          variantId?: string;
          variantColorName?: string;
          quantity: number;
          priceAtPurchase: number;
        }> = [];

        let computedTotalAmount = 0;

        // 🛡️ Hướng B (2026-09-02): COD = trừ kho ngay (đặt đơn = cam kết,
        // giữ nguyên hành vi cũ). VietQR = KHÔNG trừ kho lúc tạo đơn — đơn
        // chỉ chắc chắn khi PaymentService.handleWebhook() xác nhận PAID
        // thật (tiền đã về). Tránh "hết hàng ảo" nếu khách bỏ ngang không
        // quét mã. Validate tồn kho (throw nếu không đủ) vẫn chạy như cũ
        // cho CẢ 2 trường hợp — chỉ khác ở bước GHI xuống DB.
        const shouldDeductStockNow = (createOrderDto.paymentMethod || 'COD') !== 'BANK_TRANSFER';

        const cartItems = createOrderDto.cart || [];
        if (cartItems.length === 0) {
          throw new BadRequestException('Giỏ hàng trống, không thể tạo đơn hàng.');
        }

        for (const item of cartItems) {
          const product = await tx.product.findUnique({
            where: { id: item.id },
            include: { variants: true },
          });

          if (!product) {
            throw new BadRequestException(`Sản phẩm với ID ${item.id} không tồn tại.`);
          }
          if (!product.isActive) {
            throw new BadRequestException(`Sản phẩm "${product.title}" hiện không còn kinh doanh.`);
          }

          const quantity = item.quantity || 1;

          // ⚡ MỚI: nếu cart item có variantId, xử lý theo ĐÚNG biến thể màu
          // đó — giá và tồn kho lấy từ ProductVariant, không phải Product.
          if (item.variantId) {
            const variant = product.variants.find((v) => v.id === item.variantId);
            if (!variant) {
              throw new BadRequestException(
                `Biến thể màu đã chọn không tồn tại hoặc không thuộc sản phẩm "${product.title}".`,
              );
            }

            if (variant.stock < quantity) {
              throw new BadRequestException(
                `Sản phẩm "${product.title}" (màu ${variant.colorName}) không đủ số lượng trong kho (Còn lại: ${variant.stock})`,
              );
            }

            // Giá ưu tiên: giá riêng của variant nếu có, fallback giá sản phẩm gốc
            const unitPrice = variant.price && Number(variant.price) > 0 ? Number(variant.price) : Number(product.price);

            if (shouldDeductStockNow) {
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: variant.stock - quantity },
              });
            }

            orderItemsData.push({
              productId: item.id,
              variantId: variant.id,
              variantColorName: variant.colorName, // snapshot tên màu tại thời điểm mua
              quantity,
              priceAtPurchase: unitPrice,
            });

            computedTotalAmount += unitPrice * quantity;
          } else {
            // Sản phẩm không chọn biến thể — giữ nguyên logic cũ, dùng Product.stock/price
            if (product.stock < quantity) {
              throw new BadRequestException(
                `Sản phẩm "${product.title}" không đủ số lượng trong kho (Còn lại: ${product.stock})`,
              );
            }

            const unitPrice = Number(product.price);

            if (shouldDeductStockNow) {
              await tx.product.update({
                where: { id: item.id },
                data: { stock: product.stock - quantity },
              });
            }

            orderItemsData.push({
              productId: item.id,
              quantity,
              priceAtPurchase: unitPrice,
            });

            computedTotalAmount += unitPrice * quantity;
          }
        }

        // 🛡️ Nhóm F: mã giảm giá — SERVER tự validate + tự tính số tiền
        // giảm, KHÔNG bao giờ tin % hay số tiền giảm từ client (nguyên tắc
        // cốt lõi của dự án, giống hệt cách totalAmount luôn tự tính lại).
        let discountAmount = 0;
        let appliedDiscountCode: string | null = null;

        if (createOrderDto.discountCode?.trim()) {
          // Gọi lại ĐÚNG hàm validate của DiscountsController, truyền `tx`
          // vào để đọc trong cùng transaction với phần tăng usedCount bên
          // dưới — tránh viết lại logic validate 1 lần nữa ở đây.
          const discount = await this.discountsService.validateCode(createOrderDto.discountCode, tx);

          // Chống race: tăng usedCount CÓ ĐIỀU KIỆN ngay trong transaction.
          // Nếu maxUsage vừa đầy giữa lúc validate ở trên và lúc increment
          // này (2 đơn cùng lúc tranh nốt lượt cuối), updateMany trả
          // count=0 -> từ chối rõ ràng thay vì cho lọt qua vượt maxUsage.
          const inc = await tx.discount.updateMany({
            where: {
              id: discount.id,
              ...(discount.maxUsage !== null && { usedCount: { lt: discount.maxUsage } }),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (inc.count === 0) {
            throw new BadRequestException(
              'Mã giảm giá vừa hết lượt sử dụng, vui lòng bỏ mã và thử lại.',
            );
          }

          // percentage lưu dạng thập phân (0.1 = 10%) — đã xác nhận qua dữ
          // liệu thật trong DB và cách frontend cart/page.tsx đang dùng.
          discountAmount = Math.round(computedTotalAmount * discount.percentage);
          discountAmount = Math.min(discountAmount, computedTotalAmount); // không cho tổng âm
          appliedDiscountCode = discount.code;
        }

        const finalTotalAmount = computedTotalAmount - discountAmount;

        const newOrder = await tx.order.create({
          data: {
            userId: targetUserId!,
            customerName: createOrderDto.customerName,
            customerPhone: createOrderDto.customerPhone,
            customerEmail: createOrderDto.customerEmail || null,
            address: createOrderDto.address,
            paymentMethod: createOrderDto.paymentMethod || 'COD',
            totalAmount: finalTotalAmount,
            discountCode: appliedDiscountCode,
            discountAmount,
            paymentStatus: 'PENDING',
            shippingStatus: 'PENDING',
            orderItems: { create: orderItemsData },
          },
          include: {
            orderItems: { include: { product: true, variant: true } },
          },
        });

        return newOrder;
      });

      return {
        success: true,
        message: 'Đặt hàng thành công',
        data: {
          ...order,
          totalAmount: Number(order.totalAmount),
          discountAmount: Number(order.discountAmount),
          orderItems: order.orderItems.map((item) => ({
            ...item,
            priceAtPurchase: Number(item.priceAtPurchase),
          })),
        },
      };
    } catch (error: any) {
      // 🛡️ Nhóm F: BUG đã phát hiện khi nối Discount vào đây — trước đây
      // chỉ re-throw BadRequestException. DiscountsService.validateCode()
      // throw NotFoundException (dùng cho cả 3 ca: mã không tồn tại/hết
      // hạn/hết lượt) -> nếu không mở rộng điều kiện này, message thật bị
      // NUỐT và thay bằng thông báo chung chung bên dưới, khách không biết
      // vì sao đơn thất bại. Dùng HttpException để bao mọi lỗi HTTP có chủ
      // đích (400/404/...) mà không phải liệt kê từng loại.
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Lỗi hệ thống khi tạo đơn hàng', error?.stack || error);
      throw new BadRequestException('Có lỗi xảy ra khi xử lý đơn hàng, vui lòng thử lại.');
    }
  }

  async findByUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true, variant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: orders };
  }

  // ⚡ Hướng B: polling nhẹ cho checkout.tsx — CHỈ select đúng 1 field, ngay
  // cả khi Order thêm cột mới sau này cũng không có nguy cơ lộ thừa.
  async getPaymentStatus(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { paymentStatus: true },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }
    return { success: true, data: { paymentStatus: order.paymentStatus } };
  }

  async findOneForUser(id: string, requestingUser: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: true, variant: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại.');
    }

    const isOwner = order.userId === requestingUser.id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này.');
    }

    return { success: true, data: order };
  }

    /**
   * Tra cứu đơn hàng cho khách KHÔNG đăng nhập (Guest checkout).
   * Yêu cầu đúng CẶP (orderCode + customerPhone) khớp nhau.
   * Message lỗi luôn GENERIC — không tiết lộ mã đơn tồn tại hay không,
   * SĐT đúng hay sai — chống dò quét.
   */
  async lookupGuestOrder(dto: LookupOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode: dto.orderCode },
      include: {
        orderItems: { include: { product: true, variant: true } },
      },
    });

    if (!order || order.customerPhone !== dto.customerPhone) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại đã nhập.',
      );
    }

    return { success: true, data: order };
  }

  // ⚡ Trang quản lý đơn hàng Admin: liệt kê TOÀN BỘ đơn hàng, phân trang +
  // filter theo shippingStatus + tìm kiếm. Theo đúng pattern
  // ProductService.findPaginated() (Nhóm B), nhưng GIỮ NGUYÊN envelope
  // {success, data} — convention đã có sẵn ở MỌI method khác trong chính
  // OrdersService (findByUser/findOneForUser/lookupGuestOrder/create), ưu
  // tiên nhất quán trong-module hơn xuyên-module (CLAUDE.md đã chốt KHÔNG
  // chuẩn hóa response toàn cục qua interceptor).
  async findAllForAdmin(query: QueryOrderDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = {};

    if (query.shippingStatus) where.shippingStatus = query.shippingStatus;

    const search = query.search?.trim();
    if (search) {
      const asOrderCode = Number(search);
      where.OR = [
        // Chỉ thêm điều kiện khớp orderCode khi search thực sự là số nguyên
        // — orderCode là Int, Prisma sẽ ném lỗi type nếu so sánh với NaN.
        ...(Number.isInteger(asOrderCode) ? [{ orderCode: asOrderCode }] : []),
        { customerPhone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // $transaction để items và total đọc trên cùng 1 ảnh chụp dữ liệu —
    // tránh trường hợp total lệch với items khi có ghi xen giữa 2 truy vấn.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { include: { product: true, variant: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      success: true,
      data: {
        // 🛡️ FIX theo pattern của create(): findByUser/findOneForUser hiện
        // KHÔNG coerce Decimal -> number, nhưng list này PHẢI làm, nếu không
        // JSON trả về object Decimal thô và Frontend hiển thị/tính toán sai.
        items: items.map((order) => ({
          ...order,
          totalAmount: Number(order.totalAmount),
          discountAmount: Number(order.discountAmount),
          orderItems: order.orderItems.map((item) => ({
            ...item,
            priceAtPurchase: Number(item.priceAtPurchase),
          })),
        })),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ⚡ Trang quản lý đơn hàng Admin: cập nhật shippingStatus theo ĐÚNG state
  // machine (SHIPPING_STATUS_TRANSITIONS) — không cho nhảy cóc trạng thái
  // (VD PENDING -> DELIVERED). Khi hủy (CANCELLED), hoàn lại đúng số lượng
  // đã trừ lúc tạo đơn — mirror chính xác logic trừ kho trong create()
  // (dòng ~90-93 cho variant, ~114-117 cho product không chọn biến thể).
  //
  // ⚠️ GIỚI HẠN QUAN TRỌNG (đã thống nhất với người dùng, KHÔNG phải bỏ
  // sót): hàm này CHỈ hoàn kho, TUYỆT ĐỐI KHÔNG tự động hoàn tiền qua PayOS
  // dù đơn đã paymentStatus = PAID. Hoàn tiền thật cần Admin tự thao tác thủ
  // công trên PayOS Dashboard — tích hợp PayOS refund API là việc RIÊNG,
  // ngoài phạm vi của lần làm này. Frontend PHẢI cảnh báo rõ điều này cho
  // Admin trước khi xác nhận hủy 1 đơn đã PAID.
  async updateShippingStatus(id: string, dto: UpdateShippingStatusDto) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { orderItems: true },
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
      }

      const allowedNext = SHIPPING_STATUS_TRANSITIONS[order.shippingStatus];
      if (!allowedNext.includes(dto.shippingStatus)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái từ "${order.shippingStatus}" sang "${dto.shippingStatus}". ` +
            (allowedNext.length > 0
              ? `Chỉ có thể chuyển sang: ${allowedNext.join(', ')}.`
              : `"${order.shippingStatus}" là trạng thái cuối, không thể thay đổi thêm.`),
        );
      }

      // 🛡️ FIX: đơn BANK_TRANSFER (VietQR) theo Hướng B KHÔNG trừ kho lúc tạo
      // — chỉ trừ kho khi webhook xác nhận PAID (xem create() ở trên và
      // PaymentService.handleWebhook()). Trước fix này, hủy 1 đơn VietQR
      // đang PENDING (chưa từng bị trừ kho) vẫn CỘNG THÊM tồn kho, khiến kho
      // hiển thị NHIỀU HƠN thực tế (cộng dồn theo từng đơn bị hủy) — có thể
      // dẫn tới bán vượt tồn kho thật. Chỉ hoàn kho khi kho ĐÃ thực sự bị trừ.
      const stockWasDeducted =
        order.paymentMethod !== 'BANK_TRANSFER' || order.paymentStatus === 'PAID';

      if (dto.shippingStatus === 'CANCELLED' && stockWasDeducted) {
        for (const item of order.orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: { shippingStatus: dto.shippingStatus },
        include: { orderItems: { include: { product: true, variant: true } } },
      });

      return {
        success: true,
        data: {
          ...updated,
          totalAmount: Number(updated.totalAmount),
          discountAmount: Number(updated.discountAmount),
          orderItems: updated.orderItems.map((item) => ({
            ...item,
            priceAtPurchase: Number(item.priceAtPurchase),
          })),
        },
      };
    });
  }
}
