import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { PrismaModule } from '../prisma/prisma.module'; // Đảm bảo đường dẫn đến PrismaModule của bạn là chính xác

@Module({
  imports: [PrismaModule],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  // ⚡ Nhóm F: export để OrdersModule import và inject DiscountsService vào
  // OrdersService (nối Discount thật vào OrdersService.create()).
  exports: [DiscountsService],
})
export class DiscountsModule {}