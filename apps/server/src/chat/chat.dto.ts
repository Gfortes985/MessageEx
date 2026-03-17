import { IsBase64, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDirectChatDto {
  @IsString()
  peerUserEmail!: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(4000)
  text!: string;
}

export class UploadAttachmentDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsBase64()
  @MaxLength(15_000_000)
  contentBase64!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  text?: string;
}

export class MessageListQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
