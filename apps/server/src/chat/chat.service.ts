import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

type ChatRecord = {
  id: string;
  memberEmails: [string, string];
  createdAt: string;
};

type AttachmentRecord = {
  id: string;
  chatId: string;
  senderEmail: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
  createdAt: string;
};

type MessageRecord = {
  id: string;
  chatId: string;
  senderEmail: string;
  text: string;
  attachmentIds: string[];
  createdAt: string;
};

@Injectable()
export class ChatService {
  private readonly chats = new Map<string, ChatRecord>();
  private readonly messagesByChatId = new Map<string, MessageRecord[]>();
  private readonly attachmentsById = new Map<string, AttachmentRecord>();

  createDirectChat(ownerEmail: string, peerUserEmail: string) {
    const members = [ownerEmail, peerUserEmail].sort();

    const existing = [...this.chats.values()].find(
      (chat) => chat.memberEmails[0] === members[0] && chat.memberEmails[1] === members[1],
    );

    if (existing) {
      return existing;
    }

    const chat: ChatRecord = {
      id: randomUUID(),
      memberEmails: [members[0], members[1]],
      createdAt: new Date().toISOString(),
    };

    this.chats.set(chat.id, chat);
    this.messagesByChatId.set(chat.id, []);

    return chat;
  }

  listChats(ownerEmail: string) {
    return [...this.chats.values()].filter((chat) => chat.memberEmails.includes(ownerEmail));
  }

  sendMessage(chatId: string, senderEmail: string, text: string) {
    this.assertChatMember(chatId, senderEmail);
    return this.pushMessage(chatId, senderEmail, text, []);
  }

  uploadFile(chatId: string, senderEmail: string, fileName: string, mimeType: string, contentBase64: string, text?: string) {
    this.assertChatMember(chatId, senderEmail);

    const attachment: AttachmentRecord = {
      id: randomUUID(),
      chatId,
      senderEmail,
      fileName,
      mimeType,
      sizeBytes: Buffer.from(contentBase64, 'base64').byteLength,
      contentBase64,
      createdAt: new Date().toISOString(),
    };

    this.attachmentsById.set(attachment.id, attachment);

    const message = this.pushMessage(chatId, senderEmail, text ?? `[file] ${fileName}`, [attachment.id]);

    return {
      message,
      attachment: this.toAttachmentResponse(attachment),
    };
  }

  getAttachment(chatId: string, requesterEmail: string, attachmentId: string) {
    this.assertChatMember(chatId, requesterEmail);

    const attachment = this.attachmentsById.get(attachmentId);
    if (!attachment || attachment.chatId !== chatId) {
      throw new NotFoundException('Attachment not found');
    }

    return {
      ...this.toAttachmentResponse(attachment),
      contentBase64: attachment.contentBase64,
    };
  }

  listMessages(chatId: string, requesterEmail: string, cursor?: string, limitRaw?: string) {
    this.assertChatMember(chatId, requesterEmail);
    const messages = this.messagesByChatId.get(chatId) || [];

    const limitNumber = Number(limitRaw ?? 20);
    const limit = Number.isFinite(limitNumber) ? Math.min(Math.max(limitNumber, 1), 100) : 20;

    const sorted = [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    let startIndex = 0;
    if (cursor) {
      const foundIndex = sorted.findIndex((message) => message.id === cursor);
      startIndex = foundIndex >= 0 ? foundIndex + 1 : sorted.length;
    }

    const page = sorted.slice(startIndex, startIndex + limit).map((message) => ({
      ...message,
      attachments: message.attachmentIds
        .map((attachmentId) => this.attachmentsById.get(attachmentId))
        .filter((attachment): attachment is AttachmentRecord => Boolean(attachment))
        .map((attachment) => this.toAttachmentResponse(attachment)),
    }));

    const nextCursor = page.length === limit ? page[page.length - 1]?.id : null;

    return {
      items: page,
      nextCursor,
    };
  }

  private pushMessage(chatId: string, senderEmail: string, text: string, attachmentIds: string[]) {
    const messages = this.messagesByChatId.get(chatId);
    if (!messages) {
      throw new NotFoundException('Messages storage not found for chat');
    }

    const message: MessageRecord = {
      id: randomUUID(),
      chatId,
      senderEmail,
      text,
      attachmentIds,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);
    return message;
  }

  private assertChatMember(chatId: string, requesterEmail: string) {
    const chat = this.chats.get(chatId);
    if (!chat || !chat.memberEmails.includes(requesterEmail)) {
      throw new NotFoundException('Chat not found for user');
    }
  }

  private toAttachmentResponse(attachment: AttachmentRecord) {
    return {
      id: attachment.id,
      chatId: attachment.chatId,
      senderEmail: attachment.senderEmail,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt,
    };
  }
}
