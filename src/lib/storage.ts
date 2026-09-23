import type { Chat, Credentials } from '../types';

/**
 * Сохранение учётных данных и истории чатов в localStorage.
 *
 * ВАЖНО: apiTokenInstance хранится в браузере в открытом виде (это учебный проект).
 * Галочка «Запомнить» на экране входа позволяет не сохранять токен.
 */

const CREDENTIALS_KEY = 'greenapi-max:credentials';
const CHATS_KEY_PREFIX = 'greenapi-max:chats:';

export interface PersistedChats {
  chats: Record<string, Chat>;
  activeChatId: string | null;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadCredentials(): Credentials | null {
  const data = safeParse<Credentials>(localStorage.getItem(CREDENTIALS_KEY));
  if (!data || !data.idInstance || !data.apiTokenInstance) return null;
  return {
    apiUrl: data.apiUrl ?? '',
    idInstance: String(data.idInstance),
    apiTokenInstance: String(data.apiTokenInstance),
  };
}

export function saveCredentials(credentials: Credentials | null): void {
  if (!credentials) {
    localStorage.removeItem(CREDENTIALS_KEY);
    return;
  }
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function loadChats(idInstance: string): PersistedChats | null {
  const data = safeParse<PersistedChats>(localStorage.getItem(CHATS_KEY_PREFIX + idInstance));
  if (!data || typeof data.chats !== 'object' || data.chats === null) return null;
  return data;
}

export function saveChats(idInstance: string, state: PersistedChats): void {
  try {
    localStorage.setItem(CHATS_KEY_PREFIX + idInstance, JSON.stringify(state));
  } catch {
    // переполнение localStorage не должно ломать чат
  }
}

export function clearChats(idInstance: string): void {
  localStorage.removeItem(CHATS_KEY_PREFIX + idInstance);
}
