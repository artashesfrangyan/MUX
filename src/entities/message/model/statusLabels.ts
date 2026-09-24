import type { MessageStatus } from './types';

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'отправляется',
  sent: 'отправлено',
  delivered: 'доставлено',
  read: 'прочитано',
  failed: 'ошибка отправки',
};
