import { useLayoutEffect, useRef } from 'react';
import type { ChatMessage } from '@shared/types';
import { formatDayLabel } from '@shared/lib';
import { MessageBubble } from '@entities/message';
import s from './MessageList.module.css';

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

/**
 * Лента сообщений MAX: колонка 708px по центру, капсулы дат,
 * автоскролл вниз при появлении новых сообщений.
 */
export function MessageList({ messages, onRetry }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesCount = messages.length;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messagesCount]);

  return (
    <div className={s.scroller} ref={containerRef}>
      <div className={s.column}>
        {messages.length === 0 ? (
          <div className={s.placeholder}>
            <span>Сообщений пока нет — напишите первое сообщение в MAX</span>
          </div>
        ) : null}

        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const showDay = !previous || !isSameDay(previous.timestamp, message.timestamp);
          const isFirst = showDay || previous!.outgoing !== message.outgoing;
          const isLast =
            !next ||
            next.outgoing !== message.outgoing ||
            !isSameDay(next.timestamp, message.timestamp);

          return (
            <div className={s.group} key={message.id}>
              {showDay ? (
                <div className={s.day}>
                  <span>{formatDayLabel(message.timestamp)}</span>
                </div>
              ) : null}
              <MessageBubble
                message={message}
                isFirst={isFirst}
                isLast={isLast}
                onRetry={onRetry}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
