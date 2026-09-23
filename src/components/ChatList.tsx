import { useMemo, useState } from 'react';
import type { Chat } from '../types';
import { formatChatListTime } from '../lib/time';
import { Avatar } from './Avatar';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
}

function preview(chat: Chat): string {
  const last = chat.messages.at(-1);
  if (!last) return 'Нет сообщений';
  return `${last.outgoing ? 'Вы: ' : ''}${last.text}`;
}

/** Список чатов с поиском по названию и тексту переписки */
export function ChatList({ chats, activeChatId, onSelect }: ChatListProps) {
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
      <div className="search">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M10 2a8 8 0 105.3 14l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"
            fill="currentColor"
          />
        </svg>
        <input
          id="chatSearch"
          name="chatSearch"
          className="search__input"
          type="search"
          placeholder="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="chat-list">
        {filtered.length === 0 ? (
          <div className="chat-list__empty">
            {chats.length === 0
              ? 'Чатов пока нет. Нажмите «+», чтобы создать чат по номеру телефона.'
              : 'Ничего не найдено'}
          </div>
        ) : (
          filtered.map((chat) => {
            const last = chat.messages.at(-1);
            const isActive = chat.chatId === activeChatId;

            return (
              <button
                key={chat.chatId}
                type="button"
                className={`chat-item ${isActive ? 'chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <Avatar id={chat.chatId} title={chat.title} size={48} />
                <div className="chat-item__body">
                  <div className="chat-item__top">
                    <span className="chat-item__title">{chat.title}</span>
                    <span className="chat-item__time">
                      {last ? formatChatListTime(last.timestamp) : ''}
                    </span>
                  </div>
                  <div className="chat-item__bottom">
                    <span className="chat-item__preview">{preview(chat)}</span>
                    {chat.unread > 0 ? <span className="chat-item__badge">{chat.unread}</span> : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
