export type {
  Credentials,
  NotificationEnvelope,
  NotificationBody,
  SenderData,
  MessageData,
  SendMessageResponse,
  CheckAccountResponse,
  StateInstanceResponse,
  ChatMessage,
  Chat,
  ConnectionStatus,
  MessageStatus,
} from './domain';

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  pending: 'отправляется',
  sent: 'отправлено',
  delivered: 'доставлено',
  read: 'прочитано',
  failed: 'ошибка отправки',
};
