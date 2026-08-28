import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll() {
    return await this.productService.findAll();
  }

  @Get('categories')
  async findAllCategories() {
    return await this.productService.findAllCategories();
  }

  // ⚡ Route riêng cho Admin: thấy TOÀN BỘ sản phẩm kể cả đã ngừng kinh doanh
  // (isActive: false) — cần thiết sau khi findAll() công khai được lọc chỉ
  // còn sản phẩm đang bán (fix ở ProductService, tránh lộ sản phẩm ẩn/soft-
  // deleted ra storefront công khai).
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAllForAdmin() {
    return await this.productService.findAllForAdmin();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return await this.productService.findOne(slug);
  }

  // 🛡️ FIX QUAN TRỌNG NHẤT của Product Module:
  // Trước đây route này nhận `@Body('data') dataString?: string` rồi tự
  // `JSON.parse(dataString)` thành 1 plain object thường -> object đó KHÔNG
  // BAO GIỜ đi qua ValidationPipe của Nest (Pipe chỉ kích hoạt khi tham số
  // được khai báo đúng kiểu class DTO). Kết quả: toàn bộ ~15 decorator
  // @IsNotEmpty/@Min/@ValidateNested trong CreateProductDto chưa từng chạy
  // 1 lần nào ở request thật -> client có thể gửi price âm, thiếu title...
  //
  // Giờ sửa lại đúng chuẩn NestJS: khai báo thẳng `@Body() dto: CreateProductDto`,
  // Nest tự động transform + validate trước khi vào tới đây.
  //
  // Lưu ý: cách này giả định luồng tạo sản phẩm của Frontend là JSON thuần
  // (ảnh đã được upload trước qua /upload để lấy URL, rồi mới POST /products
  // với URL đó) — đúng như luồng CloudinaryController độc lập đang hoạt động.
  // Import FilesInterceptor/UploadedFiles trong file gốc là dead code (không
  // hề gắn @UseInterceptors nào) nên đã được loại bỏ hoàn toàn ở đây.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProductDto) {
    return await this.productService.create(dto);
  }

  // 🛡️ FIX: dùng UpdateProductDto có validate đầy đủ thay vì `any`.
  // slug KHÔNG có trong DTO này -> không thể sửa slug qua route update
  // dù có cố tình gửi lên (bị ValidationPipe loại bỏ khi bật `whitelist: true`).
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return await this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return await this.productService.remove(id);
  }
}
