import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Không có productId/userId — cùng tinh thần UpdateProductDto không cho sửa
// slug: review gắn với 1 sản phẩm + 1 người dùng là bất biến sau khi tạo.
export class UpdateReviewDto {
  @IsOptional()
  @IsInt({ message: 'rating phải là số nguyên' })
  @Min(1, { message: 'rating tối thiểu là 1' })
  @Max(5, { message: 'rating tối đa là 5' })
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bình luận tối đa 1000 ký tự' })
  comment?: string;
}
