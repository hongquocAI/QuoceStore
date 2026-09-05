import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Audit } from '../common/decorators/audit.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.addressesService.findAllForUser(req.user.id);
  }

  @Post()
  @Audit('CREATE_ADDRESS', 'Address')
  async create(@Body() dto: CreateAddressDto, @Req() req: any) {
    return this.addressesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Audit('UPDATE_ADDRESS', 'Address')
  async update(@Param('id') id: string, @Body() dto: UpdateAddressDto, @Req() req: any) {
    return this.addressesService.update(id, dto, req.user.id);
  }

  @Patch(':id/set-default')
  @Audit('SET_DEFAULT_ADDRESS', 'Address')
  async setDefault(@Param('id') id: string, @Req() req: any) {
    return this.addressesService.setDefault(id, req.user.id);
  }

  @Delete(':id')
  @Audit('DELETE_ADDRESS', 'Address')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.addressesService.remove(id, req.user.id);
  }
}
