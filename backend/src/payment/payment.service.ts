import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

const PayOSPackage = require('@payos/node');
const PayOS = PayOSPackage.PayOS || PayOSPackage.default || PayOSPackage;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private payos: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // 🛡️ FIX #1: Fail-fast thay vì fallback 'dummy-xxx'.
    // Nếu thiếu credential PayOS, ứng dụng phải CRASH ngay lúc khởi động
    // (dễ phát hiện ở CI/deploy), thay vì âm thầm chạy với key giả rồi
    // lỗi khó hiểu ở runtime khi có khách thật thanh toán.
    const clientId = this.config.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.config.get<string>('PAYOS_API_KEY');
    const checksumKey = this.config.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error(
        '❌ Thiếu cấu hình PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY. ' +
          'Kiểm tra lại file .env và Joi validationSchema trong app.module.ts.',
      );
    }

    this.payos = new PayOS({ clientId, apiKey, checksumKey });
  }

  async createPaymentLink(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // 🛡️ FIX #2: Chặn tạo lại QR cho đơn đã thanh toán hoặc đã hủy.
    // Trước đây không có check này -> có thể tạo vô số link thanh toán
    // cho 1 đơn đã PAID, gây nhầm lẫn đối soát.
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Đơn hàng này đã được thanh toán trước đó.');
    }
    if (order.shippingStatus === 'CANCELLED') {
      throw new ConflictException('Đơn hàng đã bị hủy, không thể tạo thanh toán.');
    }

    // 🛡️ FIX #3 (QUAN TRỌNG NHẤT): KHÔNG BAO GIỜ dùng dto.amount.
    // Trước đây: `amount: dto.amount` -> client tự gõ số tiền bất kỳ,
    // dán 1 orderId thật vào là tạo được QR với số tiền tùy ý.
    // Bây giờ: amount LUÔN được tính lại từ order.totalAmount đã lưu server-side
    // (chính totalAmount này cũng sẽ được server tự tính lại ở OrdersService,
    // xem phần sửa Orders Module tiếp theo).
    const amount = Math.round(Number(order.totalAmount));

    if (amount <= 0) {
      throw new BadRequestException('Số tiền đơn hàng không hợp lệ, vui lòng kiểm tra lại đơn hàng.');
    }

    const paymentData = {
      orderCode: order.orderCode,
      amount,
      description: (dto.description || `Thanh toan don ${order.orderCode}`).substring(0, 25),
      // 🛡️ FIX #4: Lấy từ ConfigService thay vì hardcode localhost:3000
      // -> khi deploy production sẽ tự đúng domain thật.
      cancelUrl: `${this.config.get<string>('FRONTEND_URL')}/checkout/cancel`,
      returnUrl: `${this.config.get<string>('FRONTEND_URL')}/checkout/success`,
    };

    try {
      const paymentLinkRes = await this.payos.paymentRequests.create(paymentData);

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          qrCodeUrl: paymentLinkRes.qrCode,
          paymentLink: paymentLinkRes.checkoutUrl,
        },
      });

      return {
        orderCode: order.orderCode,
        amount, // trả về để FE hiển thị đúng số tiền server đã chốt
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode,
      };
    } catch (error: any) {
      // 🛡️ FIX #5: Không trả error.message thô ra ngoài (information disclosure).
      // Log chi tiết ở server, trả message chung cho client.
      this.logger.error(`PayOS createPaymentLink lỗi cho order ${order.id}`, error?.stack || error);
      throw new BadRequestException('Không thể khởi tạo thanh toán lúc này, vui lòng thử lại sau.');
    }
  }

  async handleWebhook(webhookBody: any) {
    let verifiedData: any;
    try {
      verifiedData = await this.payos.webhooks.verify(webhookBody);
    } catch (error) {
      this.logger.warn('Webhook PayOS có chữ ký không hợp lệ', error);
      throw new BadRequestException('Chữ ký Webhook không hợp lệ');
    }

    if (!verifiedData) {
      throw new BadRequestException('Chữ ký Webhook không hợp lệ');
    }

    const orderCode = verifiedData.orderCode;
    const transactionId = String(verifiedData.reference || verifiedData.paymentLinkId);

    // Idempotency check (giữ nguyên logic đúng từ code gốc)
    const existingTransaction = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });
    if (existingTransaction) {
      return { success: true, message: 'Giao dịch đã được xử lý trước đó (Idempotent)' };
    }

    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: { orderItems: true },
    });
    if (!order) {
      // 🛡️ FIX (phát hiện 2026-09-02 khi test payos.webhooks.confirm() qua
      // ngrok): trước đây throw NotFoundException (404) ở đây — nhưng
      // payos.webhooks.confirm() (bắt buộc phải gọi để đăng ký URL webhook,
      // PayOS Dashboard không có ô nhập tay) tự gửi 1 request test với
      // orderCode GIẢ (cố định, không tồn tại trong DB của bất kỳ ai) để
      // kiểm tra endpoint. PayOS coi non-2xx là "URL không hợp lệ" và từ
      // chối đăng ký — bug này chặn confirm() thất bại ở CẢ dev lẫn
      // production, không chỉ vấn đề ngrok. Theo đúng thực hành chuẩn cho
      // webhook (luôn trả 2xx để xác nhận "đã nhận", không phản ánh lỗi nội
      // bộ qua mã lỗi HTTP), đổi sang log cảnh báo + trả 200 thay vì 404.
      // Không ảnh hưởng logic đối chiếu tiền/cập nhật paymentStatus — các
      // bước đó chỉ chạy khi order tồn tại, giữ nguyên bên dưới.
      this.logger.warn(
        `Webhook PayOS báo orderCode ${orderCode} nhưng không khớp đơn hàng nào trong DB ` +
          `(có thể là request test của payos.webhooks.confirm() hoặc dữ liệu không đồng bộ).`,
      );
      return { success: true, message: 'Đã nhận webhook, nhưng không tìm thấy đơn hàng khớp mã này.' };
    }

    // 🛡️ FIX #6 (QUAN TRỌNG): Đối chiếu số tiền webhook báo về với đơn hàng thật.
    // Trước đây: chỉ dựa vào verifiedData.code === '00' để mark PAID,
    // không hề kiểm tra amount -> nếu có sai lệch tích hợp/dữ liệu,
    // đơn có thể bị đánh dấu PAID sai số tiền mà không ai biết.
    const expectedAmount = Math.round(Number(order.totalAmount));
    const receivedAmount = Math.round(Number(verifiedData.amount));
    const amountMatches = expectedAmount === receivedAmount;

    if (!amountMatches) {
      this.logger.error(
        `⚠️ SAI LỆCH SỐ TIỀN webhook: order ${order.id} (mã ${orderCode}) ` +
          `kỳ vọng ${expectedAmount} nhưng webhook báo ${receivedAmount}. Cần đối soát thủ công.`,
      );
    }

    const isSuccess = verifiedData.code === '00' && amountMatches;

    // 🛡️ Hướng B (2026-09-02): trừ tồn kho VietQR ĐÚNG LÚC NÀY (webhook xác
    // nhận PAID thật), không phải lúc tạo đơn — xem OrdersService.create().
    // `order.paymentStatus !== PAID` là chốt an toàn chống trừ kho 2 lần nếu
    // webhook xử lý lại 1 đơn đã PAID (transactionId khác nhưng cùng đơn).
    const shouldDeductStock =
      isSuccess && order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== PaymentStatus.PAID;

    await this.prisma.$transaction(async (tx) => {
      const stockConflicts: Array<{ label: string; requested: number; available: number }> = [];

      if (shouldDeductStock) {
        for (const item of order.orderItems) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            const available = variant?.stock ?? 0;
            const decrementBy = Math.min(available, item.quantity);
            if (decrementBy < item.quantity) {
              stockConflicts.push({
                label: item.variantColorName ?? item.productId,
                requested: item.quantity,
                available,
              });
            }
            if (variant && decrementBy > 0) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: decrementBy } },
              });
            }
          } else {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            const available = product?.stock ?? 0;
            const decrementBy = Math.min(available, item.quantity);
            if (decrementBy < item.quantity) {
              stockConflicts.push({
                label: product?.title ?? item.productId,
                requested: item.quantity,
                available,
              });
            }
            if (product && decrementBy > 0) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: decrementBy } },
              });
            }
          }
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionId,
          amount: receivedAmount,
          paymentMethod: 'VIETQR',
          status: isSuccess ? 'SUCCESS' : 'AMOUNT_MISMATCH_OR_FAILED',
          webhookPayload: JSON.parse(JSON.stringify(webhookBody)),
        },
      });

      // ⚡ Ca hết hàng phát sinh GIỮA lúc đặt và lúc thanh toán (hiếm nhưng
      // có thể xảy ra): tiền đã về nên VẪN ghi PAID (không thể phủ nhận
      // giao dịch thật), KHÔNG tự động hoàn tiền/hủy đơn (quyết định kinh
      // doanh cần con người) — chỉ gắn cờ cảnh báo qua AuditLog để Admin xử
      // lý thủ công. Ghi trực tiếp qua Prisma (không qua @Audit()/
      // AuditLogInterceptor — cơ chế đó gắn với HTTP request có req.user,
      // không áp dụng được cho webhook server-to-server không có user).
      if (stockConflicts.length > 0) {
        this.logger.error(
          `⚠️ HẾT HÀNG khi xác nhận thanh toán: order ${order.id} (mã ${orderCode}) có item vượt tồn kho. Cần Admin xử lý thủ công.`,
        );
        await tx.auditLog.create({
          data: {
            userId: null,
            action: 'PAYMENT_STOCK_CONFLICT',
            entityType: 'Order',
            entityId: order.id,
            metadata: { orderCode: order.orderCode, conflicts: stockConflicts },
          },
        });
      }
    });

    return {
      success: true,
      message: isSuccess
        ? 'Cập nhật trạng thái thanh toán đơn hàng thành công'
        : 'Webhook đã được ghi nhận nhưng số tiền không khớp — đơn hàng được đánh dấu FAILED, cần kiểm tra thủ công.',
    };
  }
}
