import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { DiscountsModule } from '../discounts/discounts.module';

// ⚡ Import AuthModule tường minh: OrdersController giờ dùng JwtAuthGuard +
// RolesGuard, nên khai báo rõ dependency thay vì trông chờ vào việc
// JwtStrategy "tình cờ" đã được đăng ký toàn cục qua AppModule.
// (PrismaModule không cần import vì đã @Global() ở prisma.module.ts)
// ⚡ Nhóm F: import DiscountsModule để OrdersService inject được
// DiscountsService (validate mã giảm giá server-side khi tạo đơn).
@Module({
  imports: [AuthModule, DiscountsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
