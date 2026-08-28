import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateSubCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục con không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'categoryId là bắt buộc' })
  categoryId: string;
}
