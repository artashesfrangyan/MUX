import { useMemo, useState } from 'react';
import type { Chat, ChatMessage } from '@shared/types';
import { classNames, formatChatListTime } from '@shared/lib';
import { Avatar } from '@shared/ui';
import s from './ChatList.module.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  emptyHint: string;
  onSelect: (chatId: string) => void;
}

function preview(chat: Chat): string {
  const last = chat.messages.at(-1);
  if (!last) return 'Нет сообщений';
  return `${last.outgoing ? 'Вы: ' : ''}${last.text}`;
}

/** Маркер состояния последнего исходящего сообщения в списке чатов */
function StatusMarker({ message }: { message: ChatMessage }) {
  if (message.status === 'failed') {
    return (
      <span className={s.markerFailed} title="Сообщение не отправлено">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v7h-2V7h2Zm0 9v2h-2v-2h2Z"
          />
        </svg>
      </span>
    );
  }

  if (message.status === 'pending') {
    return (
      <span className={s.markerMute} title="Отправляется">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm1 2v4.6l3.2 1.9-1 1.7L11 12.6V7h2Z"
          />
        </svg>
      </span>
    );
  }

  const read = message.status === 'read';
  return (
    <span
      className={classNames(read && s.markerRead, !read && s.markerDelivered)}
      title={read ? 'Прочитано' : 'Доставлено'}
    >
      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
        <path
          d="M1.6 6.4 4.4 9.2 10 3.1M7.4 6.4l2.8 2.8L17.3 1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Список чатов MAX: аватар 56px, имя 15px/500, превью в две строки и время */
export function ChatList({ chats, activeChatId, emptyHint, onSelect }: ChatListProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chats;
    return chats.filter((chat) => {
      if (chat.title.toLowerCase().includes(needle)) return true;
      if (chat.phoneNumber?.includes(needle)) return true;
      return chat.messages.some((message) => message.text.toLowerCase().includes(needle));
    });
  }, [chats, query]);

  return (
    <>
      <div className={s.search}>
        <div className={s.searchField}>
          <input
            id="chatSearch"
            name="chatSearch"
            className={s.searchInput}
            type="text"
            placeholder="Найти"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={s.list}>
        {filtered.length === 0 ? (
          <div className={s.empty}>{query.trim() ? 'Ничего не найдено' : emptyHint}</div>
        ) : (
          filtered.map((chat) => {
            const last = chat.messages.at(-1);
            const isActive = chat.chatId === activeChatId;

            return (
              <button
                key={chat.chatId}
                type="button"
                className={classNames(s.cell, isActive && s.cellSelected)}
                onClick={() => onSelect(chat.chatId)}
              >
                <span className={s.avatar}>
                  <Avatar id={chat.chatId} title={chat.title} size={56} />
                </span>
                <h3 className={s.title}>{chat.title}</h3>
                <div className={s.meta}>
                  {last?.outgoing ? <StatusMarker message={last} /> : null}
                  <span className={s.time}>{last ? formatChatListTime(last.timestamp) : ''}</span>
                </div>
                <span className={s.preview}>{preview(chat)}</span>
                <div className={s.indicators}>
                  {chat.unread > 0 ? (
                    <span className={s.counter}>{chat.unread > 99 ? '99+' : chat.unread}</span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
