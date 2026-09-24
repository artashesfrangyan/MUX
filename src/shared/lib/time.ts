export function isSameDay(a: Date | number, b: Date | number): boolean {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatListTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (isSameDay(date, now)) return formatTime(timestamp);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'вчера';

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function formatDayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (isSameDay(date, now)) return 'Сегодня';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Вчера';

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function toMilliseconds(timestamp: number | undefined): number {
  if (!timestamp) return Date.now();
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}
