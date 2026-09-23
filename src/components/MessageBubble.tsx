import type { ChatMessage } from '../types';
import { formatTime } from '../lib/time';
import { MESSAGE_STATUS_LABELS } from '../store/chatStore';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry: (message: ChatMessage) => void;
}

function StatusMark({ message }: { message: ChatMessage }) {
  const label = MESSAGE_STATUS_LABELS[message.status];

  if (message.status === 'pending') {
    return (
      <span className="bubble__status bubble__status--pending" title={label}>
        ⏱
      </span>
    );
  }

  if (message.status === 'failed') {
    return (
      <span className="bubble__status bubble__status--failed" title={message.error ?? label}>
        !
      </span>
    );
  }

  return (
    <span
      className={`bubble__status bubble__status--${message.status}`}
      title={label}
      aria-label={label}
    >
      {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
    </span>
  );
}

/** Пузырь сообщения: исходящие — справа, входящие — слева */
export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  return (
    <div className={`bubble-row ${message.outgoing ? 'bubble-row--out' : 'bubble-row--in'}`}>
      <div className={`bubble ${message.outgoing ? 'bubble--out' : 'bubble--in'}`}>
        <div className="bubble__text">{message.text}</div>
        <div className="bubble__meta">
          <span className="bubble__time">{formatTime(message.timestamp)}</span>
          {message.outgoing ? <StatusMark message={message} /> : null}
        </div>
        {message.status === 'failed' ? (
          <div className="bubble__error">
            {message.error ?? 'Сообщение не отправлено'}
            <button type="button" className="link-button" onClick={() => onRetry(message)}>
              Повторить
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
