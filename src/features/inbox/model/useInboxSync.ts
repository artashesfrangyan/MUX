import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import {
  describeInstanceState,
  type ConnectionStatus,
  type Credentials,
  type InstanceState,
  type NotificationBody,
} from '@shared/api';
import { useNotificationPolling, type PollingState } from '@shared/hooks';
import { useToast } from '@shared/ui';
import { handleNotificationEvent, type ChatStore } from '@entities/chat';

interface UseInboxSyncOptions {
  credentials: Credentials;
  chatStore: ChatStore;
}

export interface InboxSync {
  connection: ConnectionStatus;
  connectionError: string | null;

  connectionStopped: boolean;
  reconnect: () => void;
  instanceState: InstanceState | null;
}

export function useInboxSync({ credentials, chatStore }: UseInboxSyncOptions): InboxSync {
  const { store, dispatch } = chatStore;
  const pushToast = useToast();
  const [polling, setPolling] = useState<PollingState>({ status: 'connecting' });
  const [instanceState, setInstanceState] = useState<InstanceState | null>(null);
  const [restartToken, setRestartToken] = useState(0);

  const handleNotification = (body: NotificationBody) => {
    handleNotificationEvent(body, {
      state: store,
      dispatch,
      pageHidden: document.visibilityState === 'hidden',
      onQuota: (description) =>
        pushToast('warning', description ?? 'Превышены ограничения тарифа инстанса'),
      onState: (state) => {
        setInstanceState(state);
        const { level, text } = describeInstanceState(state);
        pushToast(level === 'ok' ? 'info' : level, text);
      },
    });
  };

  useNotificationPolling({
    credentials,
    enabled: true,
    receiveTimeout: 20,
    restartToken,
    onNotification: handleNotification,
    onStatusChange: setPolling,
  });

  const markActiveChatRead = useEffectEvent(() => {
    if (store.activeChatId) {
      dispatch({ type: 'markRead', chatId: store.activeChatId });
    }
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') markActiveChatRead();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const reconnect = useCallback(() => setRestartToken((value) => value + 1), []);

  const connection = polling.status;
  return {
    connection,
    connectionError: connection === 'error' ? (polling.error ?? 'Ошибка соединения') : null,
    connectionStopped: connection === 'error' && polling.stopped === true,
    reconnect,
    instanceState,
  };
}
