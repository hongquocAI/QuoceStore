import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Audit } from '../common/decorators/audit.decorator';

// ⚡ KHÔNG có @Get() ở đây có chủ đích — đường đọc đã có sẵn
// GET /products/categories (ProductService.findAllCategories(), có cache).
// Controller này CHỈ thêm phần ghi (tạo/xóa) còn thiếu.
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Chỉ ADMIN được tạo category mới (đúng nguyên tắc MDM, giống Brand/SubCategory)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Audit('CREATE_CATEGORY', 'Category')
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Audit('DELETE_CATEGORY', 'Category')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
