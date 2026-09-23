import { useLayoutEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { formatDayLabel } from '../lib/time';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  onRetry: (message: ChatMessage) => void;
}

function isSameDay(a: number, b: number): boolean {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/** Лента сообщений с разделителями по датам и автоскроллом вниз */
export function MessageList({ messages, onRetry }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesCount = messages.length;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messagesCount]);

  if (messages.length === 0) {
    return (
      <div className="messages" ref={containerRef}>
        <div className="messages__placeholder">
          Сообщений пока нет. Напишите первое сообщение — оно отправится в MAX.
        </div>
      </div>
    );
  }

  return (
    <div className="messages" ref={containerRef}>
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDay = !previous || !isSameDay(previous.timestamp, message.timestamp);

        return (
          <div key={message.id}>
            {showDay ? (
              <div className="messages__day">
                <span>{formatDayLabel(message.timestamp)}</span>
              </div>
            ) : null}
            <MessageBubble message={message} onRetry={onRetry} />
          </div>
        );
      })}
    </div>
  );
}
