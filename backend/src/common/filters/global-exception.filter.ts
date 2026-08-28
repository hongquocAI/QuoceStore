import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';

// Bắt TOÀN BỘ exception trong app, trả về đúng 1 format lỗi duy nhất:
// { success: false, statusCode, error, message, path, timestamp }.
// Thay thế hẳn ThrottlerExceptionFilter riêng lẻ trước đó (đã gộp logic vào đây).
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
    let error = 'Internal Server Error';

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      error = 'Too Many Requests';
      message = 'Bạn đã thao tác quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút.';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        error = (res as any).error || error;
      }
    } else {
      // Lỗi không lường trước (bug thật, lỗi DB lạ...) — log CHI TI�ẾT ở
      // server, KHÔNG trả stack trace hay message thô ra ngoài cho client
      // (tránh lộ thông tin nội bộ).
      this.logger.error('Unhandled exception', (exception as any)?.stack || exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}