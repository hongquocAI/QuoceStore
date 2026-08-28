import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã màu tiếng Anh (colorCode) không được để trống' })
  colorCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên màu hiển thị (colorName) không được để trống' })
  colorName: string;

  @IsOptional()
  @IsString()
  hexCode?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giá biến thể phải là số hợp lệ' })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề sản phẩm không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug: string;

  @IsOptional()
  @IsString()
  sku?: string;

  // 🛡️ FIX (Phase 1): thay categorySlug/subCategorySlug/brandSlug/brandName
  // (string tự do) bằng 3 Foreign Key thật — ProductService sẽ tự validate
  // các ID này có tồn tại thật trong DB trước khi tạo sản phẩm.
  @IsString()
  @IsNotEmpty({ message: 'categoryId là bắt buộc' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'subCategoryId là bắt buộc' })
  subCategoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'brandId là bắt buộc' })
  brandId: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả sản phẩm không được để trống' })
  description: string;

  @IsNumber({}, { message: 'Giá sản phẩm phải là một số hợp lệ' })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  originalPrice?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsObject()
  specs?: Record<string, any>;
}