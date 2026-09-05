import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Audit } from '../common/decorators/audit.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public: bất kỳ ai (kể cả chưa đăng nhập) đều xem được review + điểm TB.
  @Get()
  async findAll(@Query() query: QueryReviewDto) {
    return this.reviewsService.findAllByProduct(query);
  }

  // ⚠️ Route tĩnh 'eligibility' PHẢI đặt TRƯỚC @Patch(':id')/@Delete(':id')
  // — dù ở đây không xung đột thật (khác method GET), giữ đúng thói quen
  // đã áp dụng cho OrdersController/ProductController.
  @UseGuards(JwtAuthGuard)
  @Get('eligibility')
  async getEligibility(@Query('productId') productId: string, @Req() req: any) {
    return this.reviewsService.getEligibility(productId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  @Audit('CREATE_REVIEW', 'Review')
  async create(@Body() dto: CreateReviewDto, @Req() req: any) {
    return this.reviewsService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @Audit('UPDATE_REVIEW', 'Review')
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto, @Req() req: any) {
    return this.reviewsService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @Audit('DELETE_REVIEW', 'Review')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.reviewsService.remove(id, req.user);
  }
}
