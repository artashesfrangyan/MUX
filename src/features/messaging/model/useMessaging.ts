import { useCallback, useEffect, useRef, type Dispatch } from 'react';
import { GreenApiError, sendMessage, type Credentials } from '@shared/api';
import type { ChatStoreAction } from '@entities/chat';
import { createLocalMessageId, isLocalMessageId, type ChatMessage } from '@entities/message';

export interface Messaging {
  handleSend: (chatId: string, text: string) => void;
  handleRetry: (message: ChatMessage) => void;
}

export const ECHO_GRACE_MS = 15_000;

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Не удалось отправить сообщение';
}

function isUncertainFailure(error: unknown): boolean {
  return error instanceof GreenApiError && error.code === 'timeout';
}

export function useMessaging(
  credentials: Credentials | null,
  dispatch: Dispatch<ChatStoreAction>,
): Messaging {
  const inFlightRef = useRef(new Set<string>());
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const deliver = useCallback(
    async (chatId: string, text: string, localId: string) => {
      const inFlight = inFlightRef.current;
      if (!credentials || inFlight.has(localId)) return;
      inFlight.add(localId);

      try {
        const { idMessage } = await sendMessage(credentials, chatId, text);
        dispatch({ type: 'resolveOutgoing', chatId, localId, idMessage });
      } catch (error) {
        const reason = errorText(error);
        const fail = () => dispatch({ type: 'failOutgoing', chatId, localId, error: reason });

        if (isUncertainFailure(error)) {
          const timer = setTimeout(() => {
            timersRef.current.delete(timer);
            fail();
          }, ECHO_GRACE_MS);
          timersRef.current.add(timer);
        } else {
          fail();
        }
      } finally {
        inFlight.delete(localId);
      }
    },
    [credentials, dispatch],
  );

  const handleSend = useCallback(
    (chatId: string, text: string) => {
      if (!credentials) return;
      const localId = createLocalMessageId();
      dispatch({
        type: 'addMessage',
        message: {
          id: localId,
          chatId,
          text,
          timestamp: Date.now(),
          outgoing: true,
          status: 'pending',
        },
      });
      void deliver(chatId, text, localId);
    },
    [credentials, deliver, dispatch],
  );

  const handleRetry = useCallback(
    (message: ChatMessage) => {
      if (message.status !== 'failed') return;

      const localId = isLocalMessageId(message.id) ? message.id : createLocalMessageId();
      if (inFlightRef.current.has(localId)) return;
      dispatch({ type: 'retryOutgoing', chatId: message.chatId, messageId: message.id, localId });
      void deliver(message.chatId, message.text, localId);
    },
    [deliver, dispatch],
  );

  return { handleSend, handleRetry };
}
