import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ChatMessage } from '@shared/types';
import { MESSAGE_STATUS_LABELS } from '@shared/types';
import { classNames, formatTime } from '@shared/lib';
import s from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  /** предыдущее сообщение от того же автора — верхние углы становятся «стековыми» */
  isFirst: boolean;
  /** следующее сообщение от того же автора — нижние углы становятся «стековыми» */
  isLast: boolean;
  onRetry: (message: ChatMessage) => void;
}

/** Маркер состояния исходящего сообщения внутри пузыря */
function StatusMark({ message }: { message: ChatMessage }) {
  const label = MESSAGE_STATUS_LABELS[message.status];

  if (message.status === 'pending') {
    return (
      <span className={s.statusPending} title={label}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm1 2v4.6l3.2 1.9-1 1.7L11 12.6V7h2Z"
          />
        </svg>
      </span>
    );
  }

  if (message.status === 'failed') {
    return (
      <span className={s.statusFailed} title={message.error ?? label}>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v7h-2V7h2Zm0 9v2h-2v-2h2Z" />
        </svg>
      </span>
    );
  }

  const single = message.status === 'sent' && !message.error;
  return (
    <span className={s.statusSent} title={label} aria-label={label}>
      {single ? (
        <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true">
          <path
            d="M1.4 5.6 4 8.2 12.4 1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="11" viewBox="0 0 18 11" aria-hidden="true">
          <path
            d="M1.4 5.6 4 8.2 10 1.6M7.6 5.6l2.6 2.6L17 1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Пузырь сообщения MAX: исходящие — справа на голубом фоне, входящие — слева на белом.
 * Время и статус лежат в правом нижнем углу; место под них резервируется
 * псевдоэлементом (как в MAX — через --metaWidth/--metaHeight).
 */
export function MessageBubble({ message, isFirst, isLast, onRetry }: MessageBubbleProps) {
  const metaRef = useRef<HTMLDivElement>(null);
  const [metaSize, setMetaSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = metaRef.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    setMetaSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
  }, [message.text, message.status, message.timestamp]);

  const outgoing = message.outgoing;
  const metaStyle = {
    '--meta-width': `${metaSize.width}px`,
    '--meta-height': `${metaSize.height}px`,
  } as CSSProperties;

  return (
    <div className={classNames(s.row, outgoing && s.rowOut)}>
      <div
        className={classNames(
          s.wrapper,
          outgoing ? s.wrapperOut : s.wrapperIn,
          !isFirst && (outgoing ? s.notFirstOut : s.notFirstIn),
          !isLast && (outgoing ? s.notLastOut : s.notLastIn),
        )}
      >
        <div className={classNames(s.bubble, outgoing ? s.bubbleOut : s.bubbleIn)}>
          <span className={s.text} style={metaStyle}>
            {message.text}
          </span>

          <div className={s.meta} ref={metaRef}>
            <span className={s.time}>{formatTime(message.timestamp)}</span>
            {outgoing ? <StatusMark message={message} /> : null}
          </div>

          {message.status === 'failed' ? (
            <div className={s.error}>
              <span>{message.error ?? 'Сообщение не отправлено'}</span>
              <button type="button" className={s.retry} onClick={() => onRetry(message)}>
                Повторить
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
