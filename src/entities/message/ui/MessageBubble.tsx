import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { classNames, formatTime } from '@shared/lib';
import { VisuallyHidden } from '@shared/ui';
import type { ChatMessage, MessageReply } from '../model/types';
import { MessageStatusIcon } from './MessageStatusIcon';
import { MessageText } from './MessageText';
import s from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isFirst: boolean;
  isLast: boolean;
  replyAuthor?: string;
  onRetry: (message: ChatMessage) => void;
}

function ReplyQuote({ reply, author }: { reply: MessageReply; author?: string }) {
  return (
    <div className={s.quote}>
      <VisuallyHidden>В ответ на сообщение: </VisuallyHidden>
      {author ? <span className={s.quoteAuthor}>{author}</span> : null}
      <span className={s.quoteText}>{reply.text ?? 'Сообщение'}</span>
    </div>
  );
}

export function MessageBubble({
  message,
  isFirst,
  isLast,
  replyAuthor,
  onRetry,
}: MessageBubbleProps) {
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
          {outgoing ? <VisuallyHidden>Вы: </VisuallyHidden> : null}
          {message.replyTo ? <ReplyQuote reply={message.replyTo} author={replyAuthor} /> : null}

          <div className={s.content}>
            <span className={s.text} style={metaStyle}>
              <MessageText text={message.text} linkClassName={s.link} />
            </span>

            <div className={s.meta} ref={metaRef}>
              <time dateTime={new Date(message.timestamp).toISOString()}>
                {formatTime(message.timestamp)}
              </time>
              {outgoing ? <MessageStatusIcon status={message.status} /> : null}
            </div>
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
