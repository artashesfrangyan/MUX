import type { Dispatch } from 'react';
import type { MessageStatus, NotificationBody } from '@shared/types';
import { parseNotification, phoneChatTitle } from '@shared/lib';
import type { ChatStoreAction } from './store';
import { chatTitleFromChatId } from './store';

const STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
};

export function handleNotificationEvent(
  body: NotificationBody | undefined,
  dispatch: Dispatch<ChatStoreAction>,
  activeChatId: string | null,
  onQuota: (description?: string) => void,
  onState: (state: string) => void,
): void {
  const event = parseNotification(body);

  switch (event.kind) {
    case 'incomingText':
    case 'outgoingText': {
      const title =
        event.title ||
        phoneChatTitle(event.chatId, event.phoneNumber) ||
        chatTitleFromChatId(event.chatId);

      dispatch({
        type: 'ensureChat',
        chatId: event.chatId,
        title,
        phoneNumber: event.phoneNumber,
        isGroup: event.isGroup,
      });

      dispatch({
        type: 'addMessage',
        message: {
          id: event.idMessage,
          chatId: event.chatId,
          text: event.text,
          timestamp: event.timestamp,
          outgoing: event.kind === 'outgoingText',
          status: 'sent',
        },
        incrementUnread: event.kind === 'incomingText' && activeChatId !== event.chatId,
      });
      break;
    }

    case 'status': {
      if (!event.chatId) break;
      dispatch({
        type: 'updateMessage',
        chatId: event.chatId,
        messageId: event.idMessage,
        patch: {
          status: STATUS_MAP[event.status] ?? 'sent',
          error:
            event.status === 'failed'
              ? 'Мессенджер MAX вернул ошибку при отправке'
              : event.status === 'noAccount'
                ? 'На номере получателя нет аккаунта MAX'
                : undefined,
        },
      });
      break;
    }

    case 'state':
      onState(event.state);
      break;

    case 'quota':
      onQuota(event.description);
      break;

    default:
      break;
  }
}
