import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
 
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}
 
  // Public: storefront + Admin dropdown đều cần đọc danh sách brand
  @Get()
  async findAll() {
    return this.brandsService.findAll();
  }
 
  // Chỉ ADMIN được tạo brand mới (đúng nguyên tắc MDM — quản lý tập trung,
  // không cho phép mỗi lần tạo sản phẩm lại tự phát sinh brand tùy tiện)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }
 
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}