import { useEffect } from 'react';

const COUNTER_PREFIX = /^\(\d+\+?\)\s/;

export function titleWithUnread(title: string, unread: number): string {
  const base = title.replace(COUNTER_PREFIX, '');
  if (unread <= 0) return base;
  return `(${unread > 99 ? '99+' : unread}) ${base}`;
}

export function useUnreadTitle(unread: number): void {
  useEffect(() => {
    document.title = titleWithUnread(document.title, unread);
    return () => {
      document.title = titleWithUnread(document.title, 0);
    };
  }, [unread]);
}
