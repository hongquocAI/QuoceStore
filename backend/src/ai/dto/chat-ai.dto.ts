import { IsNotEmpty, IsString } from 'class-validator';

export class ChatAiDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  message: string;
}