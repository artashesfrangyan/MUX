import type { MessageData, NotificationBody } from '@shared/api';
import { toMilliseconds } from './time';

export interface TextMessageFields {
  chatId: string;
  title: string;
  phoneNumber?: string;
  isGroup: boolean;
  text: string;
  idMessage: string;
  timestamp: number;
  quotedId?: string;
}

export type NotificationEvent =
  | ({ kind: 'incomingText' } & TextMessageFields)
  | ({ kind: 'outgoingText'; viaApi: boolean } & TextMessageFields)
  | { kind: 'status'; chatId: string; idMessage: string; status: string; description?: string }
  | { kind: 'state'; state: string }
  | { kind: 'quota'; description?: string }
  | { kind: 'ignored'; reason: string };

export interface TextContent {
  text: string;
  quotedId?: string;
}

function toId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const id = String(value);
  return id ? id : undefined;
}

function messageText({
  typeMessage,
  textMessageData,
  extendedTextMessageData,
}: MessageData): unknown {
  if (typeMessage === 'textMessage') return textMessageData?.textMessage;

  if (typeMessage === 'extendedTextMessage' || typeMessage === 'quotedMessage') {
    return extendedTextMessageData?.text;
  }
  return undefined;
}

export function extractTextContent(messageData: MessageData | undefined): TextContent | null {
  if (!messageData) return null;

  const text = messageText(messageData);
  if (typeof text !== 'string' || !text) return null;

  const { quotedMessage, textMessageData, extendedTextMessageData } = messageData;
  const quotedId = toId(
    quotedMessage?.stanzaId ??
      textMessageData?.quotedMessage?.stanzaId ??
      extendedTextMessageData?.stanzaId,
  );
  return quotedId ? { text, quotedId } : { text };
}

function contactName(body: NotificationBody): string {
  const senderData = body.senderData;
  if (!senderData) return '';
  return (
    senderData.chatName?.trim() ||
    senderData.senderContactName?.trim() ||
    senderData.senderName?.trim() ||
    ''
  );
}

export function parseNotification(body: NotificationBody | undefined): NotificationEvent {
  if (!body?.typeWebhook) {
    return { kind: 'ignored', reason: 'Пустое уведомление' };
  }

  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived': {
      const senderData = body.senderData;
      const content = extractTextContent(body.messageData);

      const idMessage = toId(body.idMessage);
      if (!senderData?.chatId) return { kind: 'ignored', reason: 'Нет chatId в уведомлении' };

      if (!idMessage) return { kind: 'ignored', reason: 'Нет idMessage в уведомлении' };
      if (!content) {
        return {
          kind: 'ignored',
          reason: `Пропущено нетекстовое сообщение (${body.messageData?.typeMessage ?? 'unknown'})`,
        };
      }

      const chatId = String(senderData.chatId);
      const fields: TextMessageFields = {
        chatId,
        title: contactName(body),
        phoneNumber: senderData.senderPhoneNumber
          ? String(senderData.senderPhoneNumber)
          : undefined,
        isGroup: senderData.chatType === 'group' || chatId.startsWith('-'),
        text: content.text,
        idMessage,
        timestamp: toMilliseconds(body.timestamp),
        ...(content.quotedId ? { quotedId: content.quotedId } : {}),
      };

      if (body.typeWebhook === 'incomingMessageReceived') {
        return { kind: 'incomingText', ...fields };
      }
      return {
        kind: 'outgoingText',
        viaApi: body.typeWebhook === 'outgoingAPIMessageReceived',
        ...fields,
      };
    }

    case 'outgoingMessageStatus': {
      const idMessage = toId(body.idMessage);
      if (!idMessage || !body.status) {
        return { kind: 'ignored', reason: 'Нет idMessage/status в уведомлении' };
      }
      return {
        kind: 'status',
        chatId: toId(body.chatId) ?? '',
        idMessage,
        status: body.status,
        ...(body.description ? { description: body.description } : {}),
      };
    }

    case 'stateInstanceChanged':
      return { kind: 'state', state: body.stateInstance || 'unknown' };

    case 'quotaExceeded':
      return { kind: 'quota', description: body.quotaData?.description ?? body.description };

    default:
      return { kind: 'ignored', reason: `Тип уведомления ${body.typeWebhook} не обрабатывается` };
  }
}
