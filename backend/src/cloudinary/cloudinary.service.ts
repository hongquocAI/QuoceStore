import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  // 🛡️ FIX: `folder` giờ là tham số BẮT BUỘC, không còn hardcode
  // 'quoce-products' làm mặc định. Mọi lời gọi (kể cả từ upload-script.ts)
  // phải tự tính đúng path phân tầng trước khi gọi hàm này.
  async uploadCustomImage(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
    return this.uploadSingleFileRaw(file, folder);
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const result = await this.uploadSingleFileRaw(file, folder);
      return result.secure_url;
    });
    return Promise.all(uploadPromises);
  }

  private async uploadSingleFileRaw(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            return reject(new InternalServerErrorException(`Cloudinary upload error: ${error.message}`));
          }
          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary không trả về kết quả phản hồi.'));
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
