import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { LookupOrderDto } from './dto/lookup-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

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

        const newOrder = await tx.order.create({
          data: {
            userId: targetUserId!,
            customerName: createOrderDto.customerName,
            customerPhone: createOrderDto.customerPhone,
            customerEmail: createOrderDto.customerEmail || null,
            address: createOrderDto.address,
            paymentMethod: createOrderDto.paymentMethod || 'COD',
            totalAmount: computedTotalAmount,
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
          orderItems: order.orderItems.map((item) => ({
            ...item,
            priceAtPurchase: Number(item.priceAtPurchase),
          })),
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
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
