import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { PrismaModule } from '../prisma/prisma.module'; // Đảm bảo đường dẫn đến PrismaModule của bạn là chính xác

@Module({
  imports: [PrismaModule],
  controllers: [DiscountsController],
  providers: [DiscountsService],
})
export class DiscountsModule {}