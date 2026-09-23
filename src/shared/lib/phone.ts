/**
 * Работа с номерами телефонов.
 *
 * MAX (как и GREEN-API v3) ожидает номер получателя в международном формате:
 * 11 или 12 цифр, только РФ (код 7) и РБ (код 375).
 */

/** Оставляет только цифры и приводит номер к международному формату (начинается с 7 или 375) */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // 8XXXXXXXXXX -> 7XXXXXXXXXX (привычная запись для РФ)
  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`;
  }

  // 10 цифр без кода страны -> РФ
  if (digits.length === 10) {
    return `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 12 && digits.startsWith('375')) return digits;

  return null;
}

/** Проверяет, что номер подходит для методов MAX (11 или 12 цифр, коды 7 / 375) */
export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/** +7 999 123-45-67 / +375 29 123-45-67 */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.startsWith('375') && d.length === 12) {
    return `+375 ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10)}`;
  }
  if (d.startsWith('7') && d.length === 11) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
  }
  return `+${d}`;
}

/**
 * Резервный идентификатор чата для отправки по номеру телефона.
 * GREEN-API v3 поддерживает обратную совместимость с форматом phoneNumber@c.us
 * (используется, если метод CheckAccount не смог вернуть chatId).
 */
export function phoneToChatId(digits: string): string {
  return `${digits.replace(/\D/g, '')}@c.us`;
}

/** Извлекает номер телефона из chatId вида 79991234567@c.us */
export function chatIdToPhone(chatId: string): string | null {
  const match = /^(\d{11,12})@c\.us$/.exec(chatId);
  return match ? (match[1] ?? null) : null;
}

/** Заголовок чата по номеру телефона (когда мессенджер не передал имя контакта) */
export function phoneChatTitle(chatId: string, phoneNumber?: string): string {
  const digits = (phoneNumber ? normalizePhone(phoneNumber) : null) ?? chatIdToPhone(chatId);
  if (digits) return formatPhone(digits);
  return chatId;
}
