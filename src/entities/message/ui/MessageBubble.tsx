import type { ChatMessage } from '@shared/types';
import { MESSAGE_STATUS_LABELS } from '@shared/types';
import { classNames, formatTime } from '@shared/lib';
import s from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry: (message: ChatMessage) => void;
}

function StatusMark({ message }: { message: ChatMessage }) {
  const label = MESSAGE_STATUS_LABELS[message.status];

  if (message.status === 'pending') {
    return <span title={label}>⏱</span>;
  }

  if (message.status === 'failed') {
    return (
      <span className={s.statusFailed} title={message.error ?? label}>
        !
      </span>
    );
  }

  return (
    <span
      className={classNames(message.status === 'read' && s.statusRead)}
      title={label}
      aria-label={label}
    >
      {message.status === 'read' || message.status === 'delivered' ? '✓✓' : '✓'}
    </span>
  );
}

/** Пузырь сообщения: исходящие — справа, входящие — слева */
export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  return (
    <div className={classNames(s.row, message.outgoing && s.rowOut)}>
      <div className={classNames(s.bubble, message.outgoing ? s.out : s.in)}>
        <div className={s.text}>{message.text}</div>
        <div className={s.meta}>
          <span>{formatTime(message.timestamp)}</span>
          {message.outgoing ? <StatusMark message={message} /> : null}
        </div>
        {message.status === 'failed' ? (
          <div className={s.error}>
            {message.error ?? 'Сообщение не отправлено'}
            <button type="button" className={s.linkButton} onClick={() => onRetry(message)}>
              Повторить
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
