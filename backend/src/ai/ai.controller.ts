import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { ChatAiDto } from './dto/chat-ai.dto';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // 🛡️ MỚI: Tối đa 10 tin nhắn / 60 giây / IP. Endpoint này gọi Gemini API
  // TỐN TIỀN THẬT mỗi lần gọi — trước đây hoàn toàn public, không giới hạn,
  // không cần đăng nhập -> bất kỳ ai (kể cả bot) cũng có thể spam gọi liên
  // tục để "đốt" ngân sách API của bạn. Ngưỡng 10/phút vẫn đủ cho 1 khách
  // hàng thật trò chuyện bình thường với AI Assistant.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('chat')
  async chat(@Body() dto: ChatAiDto) {
    const data = await this.aiService.chatWithAssistant(dto);
    return {
      success: true,
      message: 'Phản hồi từ AI Assistant',
      data,
    };
  }
}
