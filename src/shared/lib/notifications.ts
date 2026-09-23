import type { MessageData, NotificationBody } from '@shared/types';
import { toMilliseconds } from './time';

/** Событие, извлечённое из входящего уведомления GREEN-API */
export type NotificationEvent =
  | {
      kind: 'incomingText';
      chatId: string;
      title: string;
      phoneNumber?: string;
      isGroup: boolean;
      text: string;
      idMessage: string;
      timestamp: number;
    }
  | {
      kind: 'outgoingText';
      chatId: string;
      title: string;
      phoneNumber?: string;
      isGroup: boolean;
      text: string;
      idMessage: string;
      timestamp: number;
    }
  | { kind: 'status'; chatId: string; idMessage: string; status: string }
  | { kind: 'state'; state: string }
  | { kind: 'quota'; description?: string }
  | { kind: 'ignored'; reason: string };

/** Достаёт текст из messageData: поддерживаем textMessage и extendedTextMessage (сообщение со ссылкой) */
export function extractMessageText(messageData: MessageData | undefined): string | null {
  if (!messageData) return null;

  if (messageData.typeMessage === 'textMessage') {
    const text = messageData.textMessageData?.textMessage;
    return typeof text === 'string' && text.length > 0 ? text : null;
  }

  if (messageData.typeMessage === 'extendedTextMessage') {
    const text = messageData.extendedTextMessageData?.text;
    return typeof text === 'string' && text.length > 0 ? text : null;
  }

  return null;
}

function buildChatTitle(body: NotificationBody): string {
  const senderData = body.senderData;
  if (!senderData) return '';
  return (
    senderData.chatName?.trim() ||
    senderData.senderContactName?.trim() ||
    senderData.senderName?.trim() ||
    (senderData.senderPhoneNumber ? `+${senderData.senderPhoneNumber}` : '')
  );
}

/** Преобразует уведомление GREEN-API в доменное событие приложения */
export function parseNotification(body: NotificationBody | undefined): NotificationEvent {
  if (!body || !body.typeWebhook) {
    return { kind: 'ignored', reason: 'Пустое уведомление' };
  }

  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived': {
      const senderData = body.senderData;
      const text = extractMessageText(body.messageData);

      if (!senderData?.chatId) return { kind: 'ignored', reason: 'Нет chatId в уведомлении' };
      if (!text) {
        return {
          kind: 'ignored',
          reason: `Пропущено нетекстовое сообщение (${body.messageData?.typeMessage ?? 'unknown'})`,
        };
      }

      const common = {
        chatId: String(senderData.chatId),
        title: buildChatTitle(body),
        phoneNumber: senderData.senderPhoneNumber
          ? String(senderData.senderPhoneNumber)
          : undefined,
        isGroup: senderData.chatType === 'group' || String(senderData.chatId).startsWith('-'),
        text,
        idMessage: String(body.idMessage ?? `in-${Date.now()}`),
        timestamp: toMilliseconds(body.timestamp),
      };

      return body.typeWebhook === 'incomingMessageReceived'
        ? { kind: 'incomingText', ...common }
        : { kind: 'outgoingText', ...common };
    }

    case 'outgoingMessageStatus': {
      if (!body.idMessage || !body.status) {
        return { kind: 'ignored', reason: 'Нет idMessage/status в уведомлении' };
      }
      return {
        kind: 'status',
        chatId: String(body.chatId ?? ''),
        idMessage: String(body.idMessage),
        status: body.status,
      };
    }

    case 'stateInstanceChanged': {
      const state = (body as { stateInstance?: string }).stateInstance ?? 'unknown';
      return { kind: 'state', state };
    }

    case 'quotaExceeded':
      return { kind: 'quota', description: body.description };

    default:
      return { kind: 'ignored', reason: `Тип уведомления ${body.typeWebhook} не обрабатывается` };
  }
}
