import type { Chat, ChatMessage, ConnectionStatus } from '@shared/types';
import { phoneChatTitle } from '@shared/lib';
import { Avatar, Wallpaper } from '@shared/ui';
import { Composer, MessageList } from '@features/messaging';
import s from './ChatView.module.css';

interface ChatViewProps {
  chat: Chat;
  connection: ConnectionStatus;
  onSend: (text: string) => void;
  onRetry: (message: ChatMessage) => void;
}

/** Состояние приёма сообщений — вторая строка шапки чата */
const RECEIVE_STATE: Record<ConnectionStatus, string> = {
  offline: 'нет соединения с GREEN-API',
  connecting: 'подключение к GREEN-API…',
  online: 'приём сообщений активен',
  error: 'ошибка получения сообщений',
};

function chatSubtitle(chat: Chat, connection: ConnectionStatus): string {
  const parts: string[] = [];
  if (chat.phoneNumber) parts.push(phoneChatTitle(chat.chatId, chat.phoneNumber));
  if (chat.isGroup) parts.push('групповой чат');
  parts.push(RECEIVE_STATE[connection]);
  return parts.join(' · ');
}

/** Правая колонка MAX: шапка чата, лента сообщений на обоях и поле ввода */
export function ChatView({ chat, connection, onSend, onRetry }: ChatViewProps) {
  return (
    <section className={s.chatView}>
      <header className={s.header}>
        <Avatar id={chat.chatId} title={chat.title} size={40} />
        <div className={s.info}>
          <span className={s.title}>{chat.title}</span>
          <span className={s.subtitle}>{chatSubtitle(chat, connection)}</span>
        </div>
      </header>

      <div className={s.body}>
        <Wallpaper />
        <MessageList messages={chat.messages} onRetry={onRetry} />
        <div className={s.composerArea}>
          <Composer onSend={onSend} disabled={connection === 'offline'} />
        </div>
      </div>
    </section>
  );
}
