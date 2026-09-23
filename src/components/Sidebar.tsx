import type { Chat, ConnectionStatus } from '../types';
import { ChatList } from './ChatList';

interface SidebarProps {
  idInstance: string;
  chats: Chat[];
  activeChatId: string | null;
  connection: ConnectionStatus;
  unreadTotal: number;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  offline: 'не подключено',
  connecting: 'подключение…',
  online: 'на связи',
  error: 'ошибка соединения',
};

/** Левая колонка: список чатов, поиск и управление подключением */
export function Sidebar({
  idInstance,
  chats,
  activeChatId,
  connection,
  unreadTotal,
  onSelectChat,
  onNewChat,
  onClearHistory,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <div className="sidebar__logo">MAX</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">Чаты</span>
            <span className={`sidebar__status sidebar__status--${connection}`}>
              инстанс {idInstance} · {CONNECTION_LABELS[connection]}
            </span>
          </div>
        </div>

        <div className="sidebar__actions">
          <button
            type="button"
            className="icon-button"
            title="Новый чат по номеру телефона"
            onClick={onNewChat}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            title="Очистить историю чатов"
            onClick={onClearHistory}
            disabled={chats.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 11a2 2 0 01-2 2H9a2 2 0 01-2-2L6 9zm3 2v9h2v-9H9zm4 0v9h2v-9h-2z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button type="button" className="icon-button" title="Выйти" onClick={onLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5v-2H5V5h5V3zm5.6 3.6l-1.4 1.4 2.6 2.6H9v2h7.8l-2.6 2.6 1.4 1.4L21 12l-5.4-5.4z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </header>

      {unreadTotal > 0 ? (
        <div className="sidebar__unread">Новых сообщений: {unreadTotal}</div>
      ) : null}

      <ChatList chats={chats} activeChatId={activeChatId} onSelect={onSelectChat} />
    </aside>
  );
}
