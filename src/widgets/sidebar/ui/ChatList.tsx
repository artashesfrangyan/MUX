import { useMemo, useState } from 'react';
import { classNames, formatChatListTime } from '@shared/lib';
import { Avatar, Counter } from '@shared/ui';
import type { Chat } from '@entities/chat';
import { MessageStatusIcon } from '@entities/message';
import s from './ChatList.module.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  drafts: Readonly<Record<string, string>>;
  onSelect: (chatId: string) => void;
}

function Preview({ chat, draft }: { chat: Chat; draft?: string }) {
  if (draft) {
    return (
      <>
        <span className={s.draftLabel}>Черновик: </span>
        {draft}
      </>
    );
  }

  const last = chat.messages.at(-1);
  if (!last) return 'Нет сообщений';
  return `${last.outgoing ? 'Вы: ' : ''}${last.text}`;
}

const PHONE_QUERY = /^[\d\s()+-]*\d[\d\s()+-]*$/;

function matchesQuery(chat: Chat, needle: string): boolean {
  if (chat.title.toLowerCase().includes(needle)) return true;
  if (PHONE_QUERY.test(needle)) {
    const phoneDigits = chat.phoneNumber ?? chat.title.replace(/\D/g, '');
    if (phoneDigits.includes(needle.replace(/\D/g, ''))) return true;
  }
  return chat.messages.some((message) => message.text.toLowerCase().includes(needle));
}

export function ChatList({ chats, activeChatId, drafts, onSelect }: ChatListProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(
    () => (needle ? chats.filter((chat) => matchesQuery(chat, needle)) : chats),
    [chats, needle],
  );

  return (
    <>
      <div className={s.search}>
        <div className={s.searchField}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm9 15.5-4.4-4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="chatSearch"
            name="chatSearch"
            className={s.searchInput}
            type="search"
            aria-label="Поиск по чатам"
            placeholder="Найти"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={s.list}>
        {filtered.length === 0 ? (
          <p className={s.empty}>
            {needle ? 'Ничего не найдено' : 'Чатов пока нет — нажмите «+», чтобы начать'}
          </p>
        ) : (
          <ul className={s.items}>
            {filtered.map((chat) => {
              const last = chat.messages.at(-1);
              const isActive = chat.chatId === activeChatId;
              const draft = isActive ? undefined : drafts[chat.chatId];

              return (
                <li key={chat.chatId}>
                  <button
                    type="button"
                    className={classNames(s.cell, isActive && s.cellSelected)}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => onSelect(chat.chatId)}
                  >
                    <span className={s.avatar}>
                      <Avatar id={chat.chatId} title={chat.title} size={56} />
                    </span>
                    <span className={s.title}>{chat.title}</span>
                    <span className={s.meta}>
                      {last?.outgoing && !draft ? (
                        <MessageStatusIcon status={last.status} error={last.error} />
                      ) : null}
                      {last ? (
                        <time className={s.time} dateTime={new Date(last.timestamp).toISOString()}>
                          {formatChatListTime(last.timestamp)}
                        </time>
                      ) : null}
                    </span>
                    <span className={s.preview}>
                      <Preview chat={chat} draft={draft} />
                    </span>
                    <span className={s.indicators}>
                      <Counter value={chat.unread} label="непрочитанных" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
