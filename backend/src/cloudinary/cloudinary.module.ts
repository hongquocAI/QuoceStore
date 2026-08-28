import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { AuthModule } from '../auth/auth.module'; // ⚡ cần cho JwtAuthGuard + RolesGuard

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
