import type { Dispatch } from 'react';
import type { NotificationBody } from '@shared/api';
import { parseNotification, type NotificationEvent } from '@shared/lib';
import type { ChatMessage, MessageStatus } from '@entities/message';
import { resolveChatTitle } from '../lib/title';
import type { ChatStoreAction, ChatStoreState } from './store';

const STATUS_MAP: ReadonlyMap<string, MessageStatus> = new Map([
  ['delivered', 'delivered'],
  ['read', 'read'],
  ['failed', 'failed'],
  ['noAccount', 'failed'],
  ['notInGroup', 'failed'],
]);

const FAILURE_TEXT: ReadonlyMap<string, string> = new Map([
  ['failed', 'MAX вернул ошибку при отправке'],
  ['noAccount', 'У получателя нет аккаунта MAX'],
  ['notInGroup', 'Вы не участник этой группы'],
]);

function failureText(status: string, description?: string): string {
  const text = FAILURE_TEXT.get(status) ?? 'Сообщение не отправлено';
  return description ? `${text} (${description})` : text;
}

export interface NotificationContext {
  state: ChatStoreState;
  dispatch: Dispatch<ChatStoreAction>;
  pageHidden?: boolean;
  onQuota: (description?: string) => void;
  onState: (state: string) => void;
}

type TextEvent = Extract<NotificationEvent, { kind: 'incomingText' | 'outgoingText' }>;

function toChatMessage(event: TextEvent): ChatMessage {
  return {
    id: event.idMessage,
    chatId: event.chatId,
    text: event.text,
    timestamp: event.timestamp,
    outgoing: event.kind === 'outgoingText',
    status: 'sent',
    ...(event.quotedId ? { replyTo: { idMessage: event.quotedId } } : {}),
  };
}

function applyTextMessage(event: TextEvent, context: NotificationContext): void {
  const { chatId, isGroup } = event;

  const phoneNumber = isGroup ? undefined : event.phoneNumber;

  context.dispatch({
    type: 'ensureChat',
    chatId,
    title: resolveChatTitle(chatId, event.title, phoneNumber),
    phoneNumber,
    isGroup,
    timestamp: event.timestamp,
  });

  context.dispatch({
    type: 'addMessage',
    message: toChatMessage(event),
    echo: event.kind === 'outgoingText' && event.viaApi,
    pageHidden: context.pageHidden,
  });
}

export function handleNotificationEvent(
  body: NotificationBody | undefined,
  context: NotificationContext,
): void {
  const event = parseNotification(body);

  switch (event.kind) {
    case 'incomingText':
    case 'outgoingText':
      applyTextMessage(event, context);
      break;

    case 'status': {
      const status = STATUS_MAP.get(event.status);
      if (!event.chatId || !status) break;

      context.dispatch({
        type: 'updateStatus',
        chatId: event.chatId,
        idMessage: event.idMessage,
        status,
        ...(status === 'failed' ? { error: failureText(event.status, event.description) } : {}),
      });
      break;
    }

    case 'state':
      context.onState(event.state);
      break;

    case 'quota':
      context.onQuota(event.description);
      break;

    default:
      break;
  }
}
