import { isRecord } from '@shared/lib';
import { MESSAGE_STATUS_LABELS } from './statusLabels';
import type { ChatMessage, MessageReply, MessageStatus } from './types';

export function isMessageStatus(value: unknown): value is MessageStatus {
  return typeof value === 'string' && Object.hasOwn(MESSAGE_STATUS_LABELS, value);
}

function isMessageReply(value: unknown): value is MessageReply {
  return (
    isRecord(value) &&
    typeof value.idMessage === 'string' &&
    (value.text === undefined || typeof value.text === 'string')
  );
}

export function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.chatId === 'string' &&
    typeof value.text === 'string' &&
    typeof value.timestamp === 'number' &&
    typeof value.outgoing === 'boolean' &&
    isMessageStatus(value.status) &&
    (value.error === undefined || typeof value.error === 'string') &&
    (value.replyTo === undefined || isMessageReply(value.replyTo))
  );
}
