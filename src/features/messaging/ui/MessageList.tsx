import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatDayLabel, isSameDay } from '@shared/lib';
import { Counter } from '@shared/ui';
import { MessageBubble, type ChatMessage } from '@entities/message';
import s from './MessageList.module.css';

interface MessageListProps {
  messages: ChatMessage[];
  peerName: string;
  onRetry: (message: ChatMessage) => void;
}

const STICK_THRESHOLD_PX = 80;

function scrollToBottom(scroller: HTMLElement) {
  scroller.scrollTop = scroller.scrollHeight;
}

function isNearBottom(scroller: HTMLElement): boolean {
  return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < STICK_THRESHOLD_PX;
}

function countUnseen(messages: ChatMessage[], lastSeenId: string | undefined): number {
  const index = messages.findIndex((message) => message.id === lastSeenId);
  if (index === -1) return 0;
  return messages.slice(index + 1).filter((message) => !message.outgoing).length;
}

export function MessageList({ messages, peerName, onRetry }: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastIdRef = useRef<string | undefined>(undefined);
  const [away, setAway] = useState<{ lastSeenId: string | undefined } | null>(null);

  const last = messages.at(-1);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || last?.id === lastIdRef.current) return;
    lastIdRef.current = last?.id;
    if (stickRef.current || last?.outgoing) {
      stickRef.current = true;
      scrollToBottom(scroller);
    }
  }, [last]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (stickRef.current) scrollToBottom(scroller);
    });
    observer.observe(content);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const atBottom = isNearBottom(scroller);
    stickRef.current = atBottom;
    if (atBottom && away) setAway(null);
    else if (!atBottom && !away) setAway({ lastSeenId: lastIdRef.current });
  };

  const jumpToLatest = () => {
    const scroller = scrollerRef.current;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  };

  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const unseen = away ? countUnseen(messages, away.lastSeenId) : 0;

  return (
    <div className={s.root}>
      <div
        className={s.scroller}
        ref={scrollerRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Сообщения"
        onScroll={handleScroll}
      >
        <div className={s.column} ref={contentRef}>
          {messages.length === 0 ? (
            <div className={s.placeholder}>
              <span>Сообщений пока нет</span>
            </div>
          ) : null}

          {messages.map((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const showDay = !previous || !isSameDay(previous.timestamp, message.timestamp);
            const isFirst = showDay || previous.outgoing !== message.outgoing;
            const isLast =
              next?.outgoing !== message.outgoing || !isSameDay(next.timestamp, message.timestamp);
            const quoted = message.replyTo ? byId.get(message.replyTo.idMessage) : undefined;

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
                  replyAuthor={quoted ? (quoted.outgoing ? 'Вы' : peerName) : undefined}
                  onRetry={onRetry}
                />
              </div>
            );
          })}
        </div>
      </div>

      {away ? (
        <button
          type="button"
          className={s.jumpButton}
          aria-label={
            unseen > 0 ? `К последним сообщениям, новых: ${unseen}` : 'К последним сообщениям'
          }
          onClick={jumpToLatest}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m6 9.5 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Counter value={unseen} size="small" className={s.jumpCounter} />
        </button>
      ) : null}
    </div>
  );
}
