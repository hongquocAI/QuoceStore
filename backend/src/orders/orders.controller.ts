import { Controller, Get, Param, Patch, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { LookupOrderDto } from './dto/lookup-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateShippingStatusDto } from './dto/update-shipping-status.dto';
import { Audit } from '../common/decorators/audit.decorator';

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

  // ⚡ Trang quản lý đơn hàng Admin: liệt kê TOÀN BỘ đơn hàng, phân trang +
  // filter. ⚠️ PHẢI đặt TRƯỚC @Get(':id') bên dưới — nếu không, NestJS sẽ
  // khớp "admin" vào :id trước (đúng lỗi thứ tự route đã tránh ở
  // ProductController với route admin/all).
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAllForAdmin(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllForAdmin(query);
  }

  // ⚡ Trang quản lý đơn hàng Admin: cập nhật shippingStatus theo state
  // machine (xem SHIPPING_STATUS_TRANSITIONS trong OrdersService). Route
  // này là PATCH nên không tranh chấp thứ tự với GET :id ở dưới, nhưng vẫn
  // đặt cạnh route admin/all cho dễ đọc theo nhóm chức năng Admin.
  @Patch(':id/shipping-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Audit('UPDATE_ORDER_SHIPPING_STATUS', 'Order')
  async updateShippingStatus(@Param('id') id: string, @Body() dto: UpdateShippingStatusDto) {
    return this.ordersService.updateShippingStatus(id, dto);
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
