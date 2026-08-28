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

    const order = await this.prisma.order.findUnique({ where: { orderCode } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng mã ${orderCode}`);
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

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionId,
          amount: receivedAmount,
          paymentMethod: 'VIETQR',
          status: isSuccess ? 'SUCCESS' : 'AMOUNT_MISMATCH_OR_FAILED',
          webhookPayload: JSON.parse(JSON.stringify(webhookBody)),
        },
      }),
    ]);

    return {
      success: true,
      message: isSuccess
        ? 'Cập nhật trạng thái thanh toán đơn hàng thành công'
        : 'Webhook đã được ghi nhận nhưng số tiền không khớp — đơn hàng được đánh dấu FAILED, cần kiểm tra thủ công.',
    };
  }
}
