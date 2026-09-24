import type { MessageStatus } from './types';

const STATUS_RANK: Record<MessageStatus, number> = {
  pending: 0,
  sent: 1,
  failed: 2,
  delivered: 3,
  read: 4,
};

export function advanceStatus(current: MessageStatus, next: MessageStatus): MessageStatus {
  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current;
}
