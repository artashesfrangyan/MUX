import { useEffect, useRef, type ReactNode } from 'react';
import type { ConnectionStatus } from '@shared/api';
import { matchesMedia, phoneChatTitle, TOUCH_INPUT_QUERY } from '@shared/lib';
import { Avatar, Wallpaper } from '@shared/ui';
import type { Chat } from '@entities/chat';
import type { ChatMessage } from '@entities/message';
import { Composer, MessageList, type ComposerHandle } from '@features/messaging';
import s from './ChatView.module.css';

interface ChatViewProps {
  chat: Chat;
  connection: ConnectionStatus;
  draft: string;
  onDraftChange: (chatId: string, text: string) => void;
  onSend: (chatId: string, text: string) => void;
  onRetry: (message: ChatMessage) => void;
  onBack?: () => void;
  overlay?: ReactNode;
}

const CONNECTION_NOTE: Partial<Record<ConnectionStatus, string>> = {
  connecting: 'соединение…',
  error: 'нет связи с GREEN-API',
  offline: 'нет связи с GREEN-API',
};

function chatSubtitle(chat: Chat, connection: ConnectionStatus): string {
  const parts: string[] = [];
  const phone = phoneChatTitle(chat.phoneNumber);
  if (phone && phone !== chat.title) parts.push(phone);
  if (chat.isGroup) parts.push('групповой чат');
  const note = CONNECTION_NOTE[connection];
  if (note) parts.push(note);
  return parts.join(' · ');
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m15 5-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatView({
  chat,
  connection,
  draft,
  onDraftChange,
  onSend,
  onRetry,
  onBack,
  overlay,
}: ChatViewProps) {
  const composerRef = useRef<ComposerHandle>(null);
  const subtitle = chatSubtitle(chat, connection);
  const { chatId } = chat;

  useEffect(() => {
    if (!matchesMedia(TOUCH_INPUT_QUERY)) composerRef.current?.focus();
  }, [chatId]);

  return (
    <section className={s.chatView} aria-label={`Чат: ${chat.title}`}>
      <header className={s.header}>
        {onBack ? (
          <button type="button" className={s.back} aria-label="Назад к чатам" onClick={onBack}>
            <BackIcon />
          </button>
        ) : null}
        <Avatar id={chatId} title={chat.title} size={40} />
        <div className={s.info}>
          <h2 className={s.title}>{chat.title}</h2>
          {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
        </div>
      </header>

      <div className={s.body}>
        <Wallpaper />
        {overlay ? <div className={s.overlay}>{overlay}</div> : null}
        {}
        <MessageList
          key={chatId}
          messages={chat.messages}
          peerName={chat.title}
          onRetry={onRetry}
        />
        <div className={s.composerArea}>
          <Composer
            ref={composerRef}
            value={draft}
            onChange={(text) => onDraftChange(chatId, text)}
            onSend={(text) => onSend(chatId, text)}
            disabled={connection === 'offline'}
          />
        </div>
      </div>
    </section>
  );
}
