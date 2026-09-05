import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

// Sổ địa chỉ CHỈ dùng để điền sẵn form checkout (autofill) — KHÔNG có bất kỳ
// liên hệ nào tới OrdersService/tính tiền/tồn kho. Mỗi user chỉ thấy/sửa
// được địa chỉ của chính mình (không có route Admin quản lý địa chỉ người khác).
@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { success: true, data: addresses };
  }

  private async findOwned(id: string, userId: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ.');
    if (address.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác với địa chỉ này.');
    }
    return address;
  }

  async create(dto: CreateAddressDto, userId: string) {
    const existingCount = await this.prisma.address.count({ where: { userId } });
    // Địa chỉ ĐẦU TIÊN của user luôn tự động là mặc định — tránh trường hợp
    // user có địa chỉ nhưng không có cái nào isDefault (checkout không biết
    // autofill theo cái nào).
    const shouldBeDefault = existingCount === 0 || dto.isDefault === true;

    const address = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCount > 0) {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: {
          userId,
          recipientName: dto.recipientName,
          phone: dto.phone,
          address: dto.address,
          isDefault: shouldBeDefault,
        },
      });
    });

    return { success: true, data: address };
  }

  async update(id: string, dto: UpdateAddressDto, userId: string) {
    await this.findOwned(id, userId);
    const updated = await this.prisma.address.update({
      where: { id },
      data: { recipientName: dto.recipientName, phone: dto.phone, address: dto.address },
    });
    return { success: true, data: updated };
  }

  async setDefault(id: string, userId: string) {
    await this.findOwned(id, userId);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
    return { success: true, data: updated };
  }

  async remove(id: string, userId: string) {
    const address = await this.findOwned(id, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // Nếu vừa xóa đúng địa chỉ mặc định và user còn địa chỉ khác, tự động
      // đề bạt địa chỉ mới nhất còn lại lên làm mặc định — tránh checkout
      // rơi vào trạng thái "có địa chỉ nhưng không cái nào mặc định".
      if (address.isDefault) {
        const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });

    return { success: true, message: 'Đã xóa địa chỉ.' };
  }
}
