export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageReply {
  idMessage: string;
  text?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  outgoing: boolean;
  status: MessageStatus;
  error?: string;
  replyTo?: MessageReply;
}
