import type { ReactNode } from 'react';
import type { Chat } from '@entities/chat';
import { ChatList } from './ChatList';
import s from './Sidebar.module.css';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  drafts: Readonly<Record<string, string>>;
  connecting: boolean;
  isDemo: boolean;
  notice?: ReactNode;
  overlay?: ReactNode;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  chats,
  activeChatId,
  drafts,
  connecting,
  isDemo,
  notice,
  overlay,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  return (
    <aside className={s.panel} aria-label="Список чатов">
      <header className={s.header}>
        <div className={s.info}>
          <h2 className={s.title}>{connecting ? 'Соединение…' : 'Чаты'}</h2>
          {isDemo ? (
            <span className={s.demoBadge} title="Собеседники — эмулятор MAX">
              Демо
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={s.createButton}
          title="Новый чат по номеру телефона"
          aria-label="Новый чат"
          onClick={onNewChat}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {notice ? <div className={s.notice}>{notice}</div> : null}

      <ChatList chats={chats} activeChatId={activeChatId} drafts={drafts} onSelect={onSelectChat} />

      {overlay ? <div className={s.overlay}>{overlay}</div> : null}
    </aside>
  );
}
