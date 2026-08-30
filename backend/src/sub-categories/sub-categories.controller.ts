import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Audit } from '../common/decorators/audit.decorator';

@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  // VD: GET /sub-categories?categoryId=xxx -> dropdown phụ thuộc ở Admin form
  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    return this.subCategoriesService.findAll(categoryId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Audit('CREATE_SUB_CATEGORY', 'SubCategory')
  async create(@Body() dto: CreateSubCategoryDto) {
    return this.subCategoriesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Audit('DELETE_SUB_CATEGORY', 'SubCategory')
  async remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}
