import type { Chat, ChatMessage, ConnectionStatus } from '../types';
import { formatPhone } from '../lib/phone';
import { Avatar } from './Avatar';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

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
    <section className="chat-view">
      <header className="chat-view__header">
        <Avatar id={chat.chatId} title={chat.title} size={42} />
        <div className="chat-view__info">
          <span className="chat-view__title">{chat.title}</span>
          <span className="chat-view__subtitle">
            {chat.phoneNumber ? `${formatPhone(chat.phoneNumber)} · ` : ''}
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
