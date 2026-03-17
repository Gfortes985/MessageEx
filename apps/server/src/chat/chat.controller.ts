import { Body, Controller, Get, Headers, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { CreateDirectChatDto, MessageListQueryDto, SendMessageDto, UploadAttachmentDto } from './chat.dto';

@Controller('chats')
export class ChatController {
  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  @Post('direct')
  async createDirectChat(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreateDirectChatDto,
  ) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.createDirectChat(currentUser.email, dto.peerUserEmail);
  }

  @Get()
  async listChats(@Headers('authorization') authorization: string | undefined) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.listChats(currentUser.email);
  }

  @Get(':id/messages')
  async listMessages(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') chatId: string,
    @Query() query: MessageListQueryDto,
  ) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.listMessages(chatId, currentUser.email, query.cursor, query.limit);
  }

  @Post(':id/messages')
  async sendMessage(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.sendMessage(chatId, currentUser.email, dto.text);
  }

  @Post(':id/files')
  async uploadFile(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') chatId: string,
    @Body() dto: UploadAttachmentDto,
  ) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.uploadFile(
      chatId,
      currentUser.email,
      dto.fileName,
      dto.mimeType,
      dto.contentBase64,
      dto.text,
    );
  }

  @Get(':id/files/:fileId')
  async getFile(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') chatId: string,
    @Param('fileId') fileId: string,
  ) {
    const currentUser = await this.authService.me(this.extractBearerToken(authorization));
    return this.chatService.getAttachment(chatId, currentUser.email, fileId);
  }

  private extractBearerToken(header: string | undefined) {
    if (!header) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization must be a Bearer token');
    }

    return token;
  }
}
