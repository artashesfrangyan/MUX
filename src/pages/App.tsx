import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNotificationPolling, useToasts } from '@shared/hooks';
import { getStateInstance, setHttpApiSettings } from '@shared/api';
import { loadChats, loadCredentials, saveChats, saveCredentials, clearChats } from '@shared/lib';
import type { ConnectionStatus, Credentials, NotificationBody } from '@shared/types';
import { chatStoreReducer, initialChatStoreState, handleNotificationEvent } from '@entities/chat';
import { LoginScreen } from '@features/auth';
import { NewChatDialog, type NewChatResult } from '@features/chat';
import { useMessaging } from '@features/messaging';
import { Sidebar } from '@widgets/sidebar';
import { ChatView, EmptyState } from '@widgets/chatView';
import { Toasts } from '@shared/ui';
import s from './App.module.css';

export default function App() {
  const boot = useMemo(() => {
    const storedCredentials = loadCredentials();
    return {
      credentials: storedCredentials,
      chats: storedCredentials ? loadChats(storedCredentials.idInstance) : null,
    };
  }, []);

  const [credentials, setCredentials] = useState<Credentials | null>(boot.credentials);
  const [store, dispatch] = useReducer(chatStoreReducer, boot.chats ?? initialChatStoreState);
  const [hydratedInstance, setHydratedInstance] = useState<string | null>(
    boot.credentials?.idInstance ?? null,
  );
  const [connection, setConnection] = useState<ConnectionStatus>(
    boot.credentials ? 'connecting' : 'offline',
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [restartToken, setRestartToken] = useState(0);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const { handleSend, handleRetry } = useMessaging(credentials, dispatch, (text) =>
    pushToast('error', text),
  );

  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    if (!credentials || hydratedInstance !== credentials.idInstance) return;
    saveChats(credentials.idInstance, { chats: store.chats, activeChatId: store.activeChatId });
  }, [credentials, hydratedInstance, store]);

  const handleNotification = useCallback(
    (body: NotificationBody | undefined) => {
      handleNotificationEvent(
        body,
        dispatch,
        storeRef.current.activeChatId,
        (description) => pushToast('warning', description ?? 'Превышены ограничения тарифа инстанса'),
        (state) => {
          if (state === 'authorized') {
            setConnection('online');
            setConnectionError(null);
          } else {
            setConnection('error');
            setConnectionError(`Инстанс в состоянии «${state}»`);
          }
        },
      );
    },
    [pushToast],
  );

  const handleStatusChange = useCallback((status: ConnectionStatus, errorMessage?: string) => {
    setConnection(status);
    setConnectionError(status === 'error' ? (errorMessage ?? 'Ошибка соединения') : null);
  }, []);

  useNotificationPolling({
    credentials,
    enabled: Boolean(credentials),
    receiveTimeout: 20,
    restartToken,
    onNotification: handleNotification,
    onStatusChange: handleStatusChange,
  });

  const handleLogin = async (
    nextCredentials: Credentials,
    options: { remember: boolean; configureInstance: boolean },
  ) => {
    setLoginBusy(true);
    setLoginError(null);
    try {
      if (options.configureInstance) {
        try {
          await setHttpApiSettings(nextCredentials);
        } catch (error) {
          pushToast(
            'warning',
            `Не удалось применить настройки инстанса (${
              error instanceof Error ? error.message : 'ошибка'
            }). Включите получение уведомлений вручную в личном кабинете GREEN-API.`,
          );
        }
      }

      const state = await getStateInstance(nextCredentials);
      const persisted = loadChats(nextCredentials.idInstance);
      dispatch({ type: 'hydrate', state: persisted ?? initialChatStoreState });
      setHydratedInstance(nextCredentials.idInstance);
      saveCredentials(options.remember ? nextCredentials : null);
      setCredentials(nextCredentials);
      setConnection('connecting');
      setConnectionError(null);
      setRestartToken((v) => v + 1);

      if (state.stateInstance && state.stateInstance !== 'authorized') {
        pushToast(
          'warning',
          `Инстанс в состоянии «${state.stateInstance}». Авторизуйте номер по QR-коду в личном кабинете GREEN-API.`,
        );
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Не удалось подключиться к GREEN-API');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    saveCredentials(null);
    setCredentials(null);
    setConnection('offline');
    setConnectionError(null);
  };

  const handleClearHistory = () => {
    if (!credentials) return;
    if (!window.confirm('Удалить историю сообщений на этом устройстве? Сообщения в MAX останутся.')) return;
    clearChats(credentials.idInstance);
    dispatch({ type: 'reset' });
  };

  const handleCreateChat = (result: NewChatResult) => {
    dispatch({
      type: 'ensureChat',
      chatId: result.chatId,
      title: result.title,
      phoneNumber: result.phoneNumber,
      activate: true,
    });
    setNewChatOpen(false);
    if (result.resolvedViaApi) {
      pushToast('info', `Чат с ${result.title} создан (chatId ${result.chatId}).`);
    }
  };

  const chats = useMemo(
    () => Object.values(store.chats).sort((a, b) => b.lastActivity - a.lastActivity),
    [store.chats],
  );
  const unreadTotal = useMemo(() => chats.reduce((sum, chat) => sum + chat.unread, 0), [chats]);
  const activeChat = store.activeChatId ? (store.chats[store.activeChatId] ?? null) : null;

  if (!credentials) {
    return (
      <div className={s.app}>
        <LoginScreen
          initialCredentials={boot.credentials}
          busy={loginBusy}
          error={loginError}
          onSubmit={(creds, opts) => void handleLogin(creds, opts)}
        />
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className={s.app}>
      {connectionError ? (
        <div className={s.banner}>
          <span className={s.bannerText}>Не удаётся получать сообщения: {connectionError}</span>
          <button
            type="button"
            className={s.linkButton}
            onClick={() => setRestartToken((v) => v + 1)}
          >
            Переподключиться
          </button>
        </div>
      ) : null}

      <div className={s.container}>
        <Sidebar
          idInstance={credentials.idInstance}
          chats={chats}
          activeChatId={store.activeChatId}
          connection={connection}
          unreadTotal={unreadTotal}
          onSelectChat={(chatId) => dispatch({ type: 'setActive', chatId })}
          onNewChat={() => setNewChatOpen(true)}
          onClearHistory={handleClearHistory}
          onLogout={handleLogout}
        />

        {activeChat ? (
          <ChatView
            chat={activeChat}
            connection={connection}
            onSend={(text) => handleSend(store.activeChatId, text)}
            onRetry={handleRetry}
          />
        ) : (
          <EmptyState onNewChat={() => setNewChatOpen(true)} />
        )}
      </div>

      {newChatOpen ? (
        <NewChatDialog
          credentials={credentials}
          onClose={() => setNewChatOpen(false)}
          onCreate={handleCreateChat}
          onError={(message) => pushToast('warning', message)}
        />
      ) : null}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
