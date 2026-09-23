import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { sendMessage } from '@shared/api';
import type { Credentials, ChatMessage } from '@shared/types';
import type { ChatStoreAction } from '@entities/chat';

export function useMessaging(
  credentials: Credentials | null,
  dispatch: Dispatch<ChatStoreAction>,
  onError: (text: string) => void,
) {
  const sendText = useCallback(
    async (chatId: string, text: string, existingId?: string) => {
      if (!credentials) return;
      const messageId =
        existingId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (existingId) {
        dispatch({ type: 'updateMessage', chatId, messageId, patch: { status: 'pending', error: undefined } });
      } else {
        dispatch({
          type: 'addMessage',
          message: { id: messageId, chatId, text, timestamp: Date.now(), outgoing: true, status: 'pending' },
          incrementUnread: false,
        });
      }

      try {
        const { idMessage } = await sendMessage(credentials, chatId, text);
        dispatch({ type: 'updateMessage', chatId, messageId, patch: { id: idMessage, status: 'sent' } });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Не удалось отправить сообщение';
        dispatch({ type: 'updateMessage', chatId, messageId, patch: { status: 'failed', error: reason } });
        onError(`Сообщение не отправлено: ${reason}`);
      }
    },
    [credentials, dispatch, onError],
  );

  const handleSend = useCallback(
    (chatId: string | null, text: string) => {
      if (chatId) void sendText(chatId, text);
    },
    [sendText],
  );

  const handleRetry = useCallback(
    (message: ChatMessage) => {
      void sendText(message.chatId, message.text, message.id);
    },
    [sendText],
  );

  return { handleSend, handleRetry };
}
