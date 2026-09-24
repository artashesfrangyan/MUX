import { classNames } from '@shared/lib';
import { MESSAGE_STATUS_LABELS } from '../model/statusLabels';
import type { MessageStatus } from '../model/types';
import s from './MessageStatusIcon.module.css';

interface MessageStatusIconProps {
  status: MessageStatus;
  error?: string;
  className?: string;
}

const STATUS_CLASS: Record<MessageStatus, string | undefined> = {
  pending: s.pending,
  sent: undefined,
  delivered: undefined,
  read: s.read,
  failed: s.failed,
};

const TICK_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function StatusGlyph({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'pending':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm1 2v4.6l3.2 1.9-1 1.7L11 12.6V7h2Z"
          />
        </svg>
      );
    case 'failed':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v7h-2V7h2Zm0 9v2h-2v-2h2Z"
          />
        </svg>
      );
    case 'sent':
      return (
        <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true">
          <path d="M1.4 5.6 4 8.2 12.4 1.4" {...TICK_PROPS} />
        </svg>
      );
    case 'delivered':
    case 'read':
      return (
        <svg width="18" height="11" viewBox="0 0 18 11" aria-hidden="true">
          <path d="M1.4 5.6 4 8.2 10 1.6M7.6 5.6l2.6 2.6L17 1.6" {...TICK_PROPS} />
        </svg>
      );
  }
}

export function MessageStatusIcon({ status, error, className }: MessageStatusIconProps) {
  const label =
    status === 'failed' && error
      ? `${MESSAGE_STATUS_LABELS.failed}: ${error}`
      : MESSAGE_STATUS_LABELS[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={classNames(s.icon, STATUS_CLASS[status], className)}
    >
      <StatusGlyph status={status} />
    </span>
  );
}
