export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
};

export type ChatAttachment = {
  id: string;
  chatId: string;
  senderEmail: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderEmail: string;
  text: string;
  createdAt: string;
  attachments?: ChatAttachment[];
};
