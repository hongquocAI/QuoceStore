import { Controller, Get, Param } from '@nestjs/common';
import { DiscountsService } from './discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get('code/:code')
  async getDiscount(@Param('code') code: string) {
    const discount = await this.discountsService.validateCode(code);
    return {
      success: true,
      data: discount,
    };
  }
}