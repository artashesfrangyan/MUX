import type { ChatMessage } from '@entities/message';

export interface Chat {
  chatId: string;
  title: string;
  phoneNumber?: string;
  isGroup: boolean;
  messages: ChatMessage[];
  unread: number;
  lastActivity: number;
}
