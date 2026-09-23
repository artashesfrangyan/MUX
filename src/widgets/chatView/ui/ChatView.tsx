import type { Chat, ChatMessage, ConnectionStatus } from '@shared/types';
import { phoneChatTitle } from '@shared/lib';
import { Avatar } from '@shared/ui';
import { Composer, MessageList } from '@features/messaging';
import s from './ChatView.module.css';

interface ChatViewProps {
  chat: Chat;
  connection: ConnectionStatus;
  onSend: (text: string) => void;
  onRetry: (message: ChatMessage) => void;
}

const SUBTITLE: Record<ConnectionStatus, string> = {
  offline: 'нет соединения с GREEN-API',
  connecting: 'подключение к GREEN-API…',
  online: 'приём сообщений активен',
  error: 'ошибка получения сообщений',
};

/** Правая колонка: заголовок чата, лента сообщений и поле ввода */
export function ChatView({ chat, connection, onSend, onRetry }: ChatViewProps) {
  return (
    <section className={s.chatView}>
      <header className={s.header}>
        <Avatar id={chat.chatId} title={chat.title} size={42} />
        <div className={s.info}>
          <span className={s.title}>{chat.title}</span>
          <span className={s.subtitle}>
            {chat.phoneNumber ? `${phoneChatTitle(chat.chatId, chat.phoneNumber)} · ` : ''}
            {chat.isGroup ? 'групповой чат · ' : ''}
            {SUBTITLE[connection]}
          </span>
        </div>
      </header>

      <MessageList messages={chat.messages} onRetry={onRetry} />
      <Composer onSend={onSend} disabled={connection === 'offline'} />
    </section>
  );
}
