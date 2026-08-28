import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAiDto } from './dto/chat-ai.dto';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY') || 'dummy-key';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chatWithAssistant(dto: ChatAiDto) {
    try {
      // 1. Rút truy vấn danh sách sản phẩm đang bán từ DB làm Context
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          title: true,
          price: true,
          description: true,
          slug: true,
        },
        take: 20,
      });

      const systemInstruction = `
Bạn là Trợ lý AI tư vấn mua sắm thông minh của hệ thống QUOCÉ.
Dưới đây là danh sách sản phẩm hiện có trong kho hàng:
${JSON.stringify(products, null, 2)}

Quy tắc trả lời:
1. Thân thiện, lịch sự, đóng vai chuyên viên tư vấn bán hàng.
2. Dựa vào danh sách sản phẩm ở trên để gợi ý chính xác tên và giá tiền cho khách hàng.
3. Nếu không có sản phẩm khách yêu cầu, hãy thông báo lịch sự và tư vấn sản phẩm tương tự.
`;

      // 2. Gọi Gemini API
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nCâu hỏi từ khách hàng: ${dto.message}` }],
          },
        ],
      });

      return {
        reply: response.text,
      };
    } catch (error: any) {

        console.error("LỖI CHI TIẾT TỪ GOOGLE AI:", error);
      throw new InternalServerErrorException(`Lỗi xử lý Gemini AI: ${error.message}`);
    }
  }
}