import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getStateInstance, sendMessage, setHttpApiSettings } from './api/greenApi';
import { ChatView } from './components/ChatView';
import { EmptyState } from './components/EmptyState';
import { LoginScreen } from './components/LoginScreen';
import { NewChatDialog, type NewChatResult } from './components/NewChatDialog';
import { Sidebar } from './components/Sidebar';
import { Toasts, type Toast } from './components/Toasts';
import { useNotificationPolling } from './hooks/useNotificationPolling';
import { parseNotification } from './lib/notifications';
import { phoneChatTitle } from './lib/phone';
import { clearChats, loadChats, loadCredentials, saveChats, saveCredentials } from './lib/storage';
import { chatStoreReducer, chatTitleFromChatId, initialChatStoreState } from './store/chatStore';
import type { ChatMessage, ConnectionStatus, Credentials, MessageStatus } from './types';

/** Статусы GREEN-API → внутренние статусы сообщения */
const STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
};

export default function App() {
  // стартовые данные: учётные данные и история чатов из localStorage
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

  const [connection, setConnection] = useState<ConnectionStatus>(boot.credentials ? 'connecting' : 'offline');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [restartToken, setRestartToken] = useState(0);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastIdRef = useRef(0);
  const storeRef = useRef(store);
  storeRef.current = store;

  const pushToast = useCallback((kind: Toast['kind'], text: string) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((current) => [...current, { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 9000);
  }, []);

  // сохраняем переписку для текущего инстанса
  useEffect(() => {
    if (!credentials || hydratedInstance !== credentials.idInstance) return;
    saveChats(credentials.idInstance, { chats: store.chats, activeChatId: store.activeChatId });
  }, [credentials, hydratedInstance, store]);

  /** Обработка входящего уведомления GREEN-API (приходит из цикла опроса) */
  const handleNotification = useCallback(
    (body: Parameters<typeof parseNotification>[0]) => {
      const event = parseNotification(body);
      const current = storeRef.current;

      switch (event.kind) {
        case 'incomingText':
        case 'outgoingText': {
          const title =
            event.title || phoneChatTitle(event.chatId, event.phoneNumber) || chatTitleFromChatId(event.chatId);

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
            incrementUnread: event.kind === 'incomingText' && current.activeChatId !== event.chatId,
          });
          break;
        }

        case 'status': {
          const chatId =
            event.chatId ||
            Object.values(current.chats).find((chat) =>
              chat.messages.some((message) => message.id === event.idMessage),
            )?.chatId;

          if (!chatId) break;

          dispatch({
            type: 'updateMessage',
            chatId,
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
          if (event.state === 'authorized') {
            setConnection('online');
            setConnectionError(null);
          } else {
            setConnection('error');
            setConnectionError(`Инстанс в состоянии «${event.state}»`);
          }
          break;

        case 'quota':
          pushToast('warning', event.description ?? 'Превышены ограничения тарифа инстанса');
          break;

        default:
          break;
      }
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

  /** Отправка текста: оптимистично показываем сообщение и уточняем id от GREEN-API */
  const sendText = useCallback(
    async (chatId: string, text: string, existingId?: string) => {
      if (!credentials) return;
      const messageId =
        existingId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (existingId) {
        dispatch({
          type: 'updateMessage',
          chatId,
          messageId,
          patch: { status: 'pending', error: undefined },
        });
      } else {
        dispatch({
          type: 'addMessage',
          message: {
            id: messageId,
            chatId,
            text,
            timestamp: Date.now(),
            outgoing: true,
            status: 'pending',
          },
          incrementUnread: false,
        });
      }

      try {
        const { idMessage } = await sendMessage(credentials, chatId, text);
        dispatch({
          type: 'updateMessage',
          chatId,
          messageId,
          patch: { id: idMessage, status: 'sent' },
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Не удалось отправить сообщение';
        dispatch({
          type: 'updateMessage',
          chatId,
          messageId,
          patch: { status: 'failed', error: reason },
        });
        pushToast('error', `Сообщение не отправлено: ${reason}`);
      }
    },
    [credentials, pushToast],
  );

  const handleSend = (text: string) => {
    const chatId = storeRef.current.activeChatId;
    if (chatId) void sendText(chatId, text);
  };

  const handleRetry = (message: ChatMessage) => {
    void sendText(message.chatId, message.text, message.id);
  };

  const handleSelectChat = (chatId: string) => {
    dispatch({ type: 'setActive', chatId });
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
      setRestartToken((value) => value + 1);

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
    if (!window.confirm('Удалить историю сообщений на этом устройстве? Сообщения в MAX останутся.')) {
      return;
    }
    clearChats(credentials.idInstance);
    dispatch({ type: 'reset' });
  };

  const chats = useMemo(
    () => Object.values(store.chats).sort((a, b) => b.lastActivity - a.lastActivity),
    [store.chats],
  );
  const unreadTotal = useMemo(() => chats.reduce((sum, chat) => sum + chat.unread, 0), [chats]);
  const activeChat = store.activeChatId ? (store.chats[store.activeChatId] ?? null) : null;

  const dismissToast = (id: number) =>
    setToasts((current) => current.filter((toast) => toast.id !== id));

  if (!credentials) {
    return (
      <div className="app">
        <LoginScreen
          initialCredentials={boot.credentials}
          busy={loginBusy}
          error={loginError}
          onSubmit={(nextCredentials, options) => {
            void handleLogin(nextCredentials, options);
          }}
        />
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="app">
      {connectionError ? (
        <div className="banner">
          <span className="banner__text">Не удаётся получать сообщения: {connectionError}</span>
          <button
            type="button"
            className="link-button"
            onClick={() => setRestartToken((value) => value + 1)}
          >
            Переподключиться
          </button>
        </div>
      ) : null}

      <div className="app__container">
        <Sidebar
          idInstance={credentials.idInstance}
          chats={chats}
          activeChatId={store.activeChatId}
          connection={connection}
          unreadTotal={unreadTotal}
          onSelectChat={handleSelectChat}
          onNewChat={() => setNewChatOpen(true)}
          onClearHistory={handleClearHistory}
          onLogout={handleLogout}
        />

        {activeChat ? (
          <ChatView
            chat={activeChat}
            connection={connection}
            onSend={handleSend}
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
