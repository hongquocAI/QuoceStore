import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-qr')
  async createPayment(@Body() dto: CreatePaymentDto) {
    const data = await this.paymentService.createPaymentLink(dto);
    return {
      success: true,
      message: 'Tạo mã QR thanh toán VietQR thành công',
      data,
    };
  }

  // Ghi chú: Webhook không thể gắn JwtAuthGuard vì PayOS gọi trực tiếp,
  // không mang JWT của user. Bảo mật của endpoint này đến từ chữ ký
  // verifyPaymentWebhookData() bên trong Service — đã đúng từ đầu, giữ nguyên.
  @HttpCode(HttpStatus.OK)
  @Post('payos-webhook')
  async handlePayOSWebhook(@Body() body: any) {
    return await this.paymentService.handleWebhook(body);
  }
}
