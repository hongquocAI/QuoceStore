import { Controller, Get, Param, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { LookupOrderDto } from './dto/lookup-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public: khách vãng lai (guest) vẫn đặt hàng được không cần đăng nhập.
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // 🛡️ FIX NGHIÊM TRỌNG: đã xóa toàn bộ logic tự viết `jwt.verify(...)` rồi
  // fallback sang `jwt.decode(...)` khi verify thất bại. `jwt.decode()`
  // KHÔNG kiểm tra chữ ký -> bất kỳ ai cũng có thể tự tạo 1 JWT giả với
  // `sub: "<userId bất kỳ>"` để đọc đơn hàng của người khác. Giờ dùng đúng
  // JwtAuthGuard + JwtStrategy đã có sẵn (verify chữ ký chuẩn), NestJS tự
  // gắn user đã xác thực vào req.user.
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@Req() req: any) {
    return this.ordersService.findByUser(req.user.id);
  }

  // 🛡️ FIX: Route lấy đơn hàng theo userId cụ thể trước đây PUBLIC hoàn toàn
  // (IDOR - ai cũng xem được đơn hàng của bất kỳ ai). Giờ chỉ ADMIN được dùng
  // route này (dùng cho trang quản trị); khách hàng dùng /orders/my-orders.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('user/:userId')
  async getOrdersByUser(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // Tra cứu đơn hàng công khai cho Guest — không cần JWT, nhưng bắt buộc
  // đúng cặp mã đơn + SĐT. Rate-limit chặt (5/phút) vì đây là endpoint
  // public duy nhất cho phép "thử" thông tin định danh.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('lookup')
  async lookupGuestOrder(@Body() dto: LookupOrderDto) {
    return this.ordersService.lookupGuestOrder(dto);
  }

  // 🛡️ FIX: Trước đây PUBLIC hoàn toàn -> lộ tên, SĐT, địa chỉ của bất kỳ
  // khách hàng nào cho bất kỳ ai đoán được ID đơn hàng. Giờ bắt buộc đăng
  // nhập, và Service sẽ kiểm tra chỉ chủ đơn hàng hoặc ADMIN mới xem được.
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findOneForUser(id, req.user);
  }
}
