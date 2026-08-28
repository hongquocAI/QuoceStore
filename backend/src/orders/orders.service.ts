import { Injectable, BadRequestException, NotFoundException, ForbiddenException, HttpException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { LookupOrderDto } from './dto/lookup-order.dto';

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

            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: variant.stock - quantity },
            });

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

            await tx.product.update({
              where: { id: item.id },
              data: { stock: product.stock - quantity },
            });

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
}
