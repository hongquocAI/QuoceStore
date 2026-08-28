import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // 👈 Import module
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, AuthModule], // 👈 Đưa vào mảng imports
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}