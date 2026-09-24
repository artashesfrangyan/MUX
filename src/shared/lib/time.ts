/** Форматирование времени сообщений */

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** ЧЧ:ММ */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Короткая дата для списка чатов в формате MAX: время за сегодня, «вчера», «23 сент.» */
export function formatChatListTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (sameDay(date, now)) return formatTime(timestamp);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'вчера';

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Заголовок-разделитель для дат в переписке */
export function formatDayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (sameDay(date, now)) return 'Сегодня';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Вчера';

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** timestamp из GREEN-API приходит в секундах */
export function toMilliseconds(timestamp: number | undefined): number {
  if (!timestamp) return Date.now();
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}
