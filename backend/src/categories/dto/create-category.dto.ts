import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' })
  slug: string;
}
