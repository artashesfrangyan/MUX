import type { Chat } from '@shared/types';
import { ChatList } from './ChatList';
import s from './Sidebar.module.css';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  /** подсказка в списке, когда чатов нет (зависит от выбранного раздела) */
  emptyHint: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

/** Панель чатов MAX: заголовок «Чаты», поиск и список диалогов */
export function Sidebar({ chats, activeChatId, emptyHint, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <aside className={s.panel}>
      <header className={s.header}>
        <div className={s.info}>
          <h2 className={s.title}>Чаты</h2>
        </div>
        <div className={s.actions}>
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
        </div>
      </header>

      <ChatList
        chats={chats}
        activeChatId={activeChatId}
        emptyHint={emptyHint}
        onSelect={onSelectChat}
      />
    </aside>
  );
}
